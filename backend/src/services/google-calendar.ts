import { z } from 'zod';
import { config } from '../config.js';
import { UpstreamError } from '../lib/api-error.js';
import { addIsoDays, localDateRangeUtc, zonedTimeToUtc } from '../lib/time.js';
import { TtlCache } from '../lib/ttl-cache.js';

interface EventView {
  id: string;
  time: string;
  ampm: string;
  title: string;
  sub: string;
  active: boolean;
}

interface GoogleCalendarConfig {
  calendarId: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  timeoutMs: number;
  ttlMs: number;
  staleFallbackMs: number;
  maxResults: number;
}

interface GoogleCalendarClientOptions {
  config?: GoogleCalendarConfig;
  fetcher?: typeof fetch;
  now?: () => Date;
}

const GoogleTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
});

const GoogleEventDateSchema = z.object({
  date: z.string().optional(),
  dateTime: z.string().optional(),
  timeZone: z.string().optional(),
});

const GoogleEventsSchema = z.object({
  items: z.array(z.object({
    id: z.string().optional(),
    summary: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    start: GoogleEventDateSchema,
    end: GoogleEventDateSchema,
  })).optional(),
});

type GoogleEventsPayload = z.infer<typeof GoogleEventsSchema>;
export type GoogleCalendarEvent = NonNullable<GoogleEventsPayload['items']>[number];

export class GoogleCalendarClient {
  private readonly tokenCache = new TtlCache<string>();
  private readonly eventsCache = new TtlCache<EventView[]>();
  private readonly config: GoogleCalendarConfig;
  private readonly fetcher: typeof fetch;
  private readonly now: () => Date;

  constructor(options: GoogleCalendarClientOptions = {}) {
    this.config = options.config ?? config.googleCalendar;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? (() => new Date());
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.apiKey
      || (this.config.clientId && this.config.clientSecret && this.config.refreshToken),
    );
  }

  async listEventsForDate(date: string, timezone: string): Promise<EventView[]> {
    const cacheKey = `${this.config.calendarId}:${date}:${timezone}`;
    const cached = this.eventsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const events = await this.fetchEventsForDate(date, timezone);
      this.eventsCache.set(
        cacheKey,
        events,
        this.config.ttlMs,
        this.config.staleFallbackMs,
      );
      return events;
    } catch (err) {
      const stale = this.eventsCache.getStale(cacheKey);
      if (stale) return stale;
      throw err;
    }
  }

  private async fetchEventsForDate(date: string, timezone: string): Promise<EventView[]> {
    if (!this.isConfigured()) {
      throw new UpstreamError('Google Calendar is not configured', 503, 'calendar_not_configured');
    }

    const { start, end } = localDateRangeUtc(date, timezone);
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events`);
    url.searchParams.set('timeMin', start.toISOString());
    url.searchParams.set('timeMax', end.toISOString());
    url.searchParams.set('timeZone', timezone);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('showDeleted', 'false');
    url.searchParams.set('maxResults', String(this.config.maxResults));

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.config.apiKey && !this.config.refreshToken) {
      url.searchParams.set('key', this.config.apiKey);
    } else {
      headers.Authorization = `Bearer ${await this.getAccessToken()}`;
    }

    const payload = await this.fetchJson(url, { headers });
    const parsed = GoogleEventsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UpstreamError(
        'Google Calendar response did not match the expected shape',
        502,
        'calendar_bad_response',
        parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join('.'),
          message: issue.message,
        })),
      );
    }

    return mapGoogleCalendarEvents(parsed.data.items ?? [], date, timezone, this.now())
      .slice(0, this.config.maxResults);
  }

  private async getAccessToken(): Promise<string> {
    const cached = this.tokenCache.get('oauth');
    if (cached) return cached;

    const { clientId, clientSecret, refreshToken } = this.config;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new UpstreamError('Google Calendar OAuth credentials are not configured', 503, 'calendar_not_configured');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const payload = await this.fetchJson(new URL('https://oauth2.googleapis.com/token'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const parsed = GoogleTokenSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UpstreamError('Google OAuth token response did not match the expected shape', 502, 'calendar_auth_bad_response');
    }

    this.tokenCache.set('oauth', parsed.data.access_token, Math.max(1_000, (parsed.data.expires_in ?? 3600) * 1_000 - 60_000), 0);
    return parsed.data.access_token;
  }

  private async fetchJson(url: URL, init: RequestInit = {}): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await this.fetcher(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        throw new UpstreamError(
          `Google Calendar API returned ${res.status} ${res.statusText}`,
          retryable ? 503 : 502,
          retryable ? 'calendar_upstream_error' : 'calendar_bad_status',
        );
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof UpstreamError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new UpstreamError('Google Calendar request timed out', 504, 'calendar_timeout');
      }
      if (err instanceof Error) throw new UpstreamError(err.message, 503, 'calendar_upstream_error');
      throw new UpstreamError('Google Calendar request failed', 503, 'calendar_upstream_error');
    }
  }
}

function startInstant(event: GoogleCalendarEvent, timezone: string): Date {
  if (event.start.dateTime) return new Date(event.start.dateTime);
  return zonedTimeToUtc(event.start.date ?? localDate(new Date(), timezone), '00:00', timezone);
}

function endInstant(event: GoogleCalendarEvent, timezone: string): Date {
  if (event.end.dateTime) return new Date(event.end.dateTime);
  const endDate = event.end.date ?? addIsoDays(event.start.date ?? localDate(new Date(), timezone), 1);
  return zonedTimeToUtc(endDate, '00:00', timezone);
}

function localDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatTime(date: Date, timezone: string): { time: string; ampm: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find(part => part.type === 'hour')!.value;
  const minute = parts.find(part => part.type === 'minute')!.value;
  const dayPeriod = parts.find(part => part.type === 'dayPeriod')!.value;
  return { time: `${hour}:${minute}`, ampm: dayPeriod };
}

function subtitle(event: GoogleCalendarEvent, end: Date, timezone: string, allDay: boolean): string {
  const location = event.location?.trim();
  if (location) return location;
  if (allDay) return 'All day';
  return `Until ${formatTime(end, timezone).time}`;
}

export function mapGoogleCalendarEvents(
  events: GoogleCalendarEvent[],
  date: string,
  timezone: string,
  now: Date,
): EventView[] {
  return events
    .filter((event) => event.status !== 'cancelled')
    .map((event, index) => {
      const allDay = Boolean(event.start.date && !event.start.dateTime);
      const start = startInstant(event, timezone);
      const end = endInstant(event, timezone);
      const time = allDay ? { time: 'ALL', ampm: 'DAY' } : formatTime(start, timezone);

      return {
        startMs: start.getTime(),
        view: {
          id: event.id ?? `calendar-${index}`,
          time: time.time,
          ampm: time.ampm,
          title: event.summary?.trim() || 'Busy',
          sub: subtitle(event, end, timezone, allDay),
          active: now >= start && now < end && (allDay || localDate(now, timezone) === date),
        },
      };
    })
    .sort((a, b) => a.startMs - b.startMs)
    .map((event) => event.view);
}

export const googleCalendar = new GoogleCalendarClient();
