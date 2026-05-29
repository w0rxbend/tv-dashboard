import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GoogleCalendarClient, mapGoogleCalendarEvents } from './google-calendar.js';

const baseConfig = {
  calendarId: 'primary',
  timeoutMs: 1_000,
  ttlMs: 1_000,
  staleFallbackMs: 1_000,
  maxResults: 10,
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

test('mapGoogleCalendarEvents maps timed and all-day events into dashboard rows', () => {
  const events = mapGoogleCalendarEvents(
    [
      {
        id: 'timed-1',
        summary: 'Design Review',
        location: 'Studio',
        status: 'confirmed',
        start: { dateTime: '2026-05-29T10:30:00+03:00' },
        end: { dateTime: '2026-05-29T11:30:00+03:00' },
      },
      {
        id: 'all-day-1',
        summary: 'Public holiday',
        status: 'confirmed',
        start: { date: '2026-05-29' },
        end: { date: '2026-05-30' },
      },
      {
        id: 'cancelled-1',
        summary: 'Cancelled',
        status: 'cancelled',
        start: { dateTime: '2026-05-29T08:00:00+03:00' },
        end: { dateTime: '2026-05-29T09:00:00+03:00' },
      },
    ],
    '2026-05-29',
    'Europe/Kyiv',
    new Date('2026-05-29T07:45:00Z'),
  );

  assert.equal(events.length, 2);
  assert.deepEqual(events[0], {
    id: 'all-day-1',
    time: 'ALL',
    ampm: 'DAY',
    title: 'Public holiday',
    sub: 'All day',
    active: true,
  });
  assert.deepEqual(events[1], {
    id: 'timed-1',
    time: '10:30',
    ampm: 'AM',
    title: 'Design Review',
    sub: 'Studio',
    active: true,
  });
});

test('GoogleCalendarClient fetches public calendar events with API key', async () => {
  const requests: URL[] = [];
  const client = new GoogleCalendarClient({
    config: {
      ...baseConfig,
      calendarId: 'public@example.com',
      apiKey: 'public-key',
    },
    now: () => new Date('2026-05-29T07:45:00Z'),
    fetcher: async (url) => {
      requests.push(url instanceof URL ? url : new URL(String(url)));
      return jsonResponse({
        items: [
          {
            id: 'evt-1',
            summary: 'Design Review',
            location: 'Studio',
            status: 'confirmed',
            start: { dateTime: '2026-05-29T10:30:00+03:00' },
            end: { dateTime: '2026-05-29T11:30:00+03:00' },
          },
        ],
      });
    },
  });

  const events = await client.listEventsForDate('2026-05-29', 'Europe/Kyiv');

  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'Design Review');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].hostname, 'www.googleapis.com');
  assert.equal(requests[0].searchParams.get('key'), 'public-key');
  assert.equal(requests[0].searchParams.get('singleEvents'), 'true');
  assert.equal(requests[0].searchParams.get('orderBy'), 'startTime');
  assert.equal(requests[0].searchParams.get('timeZone'), 'Europe/Kyiv');
});

test('GoogleCalendarClient exchanges refresh token and uses bearer auth', async () => {
  const requests: Array<{ url: URL; auth?: string }> = [];
  const client = new GoogleCalendarClient({
    config: {
      ...baseConfig,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    },
    now: () => new Date('2026-05-29T07:45:00Z'),
    fetcher: async (url, init = {}) => {
      const parsed = url instanceof URL ? url : new URL(String(url));
      requests.push({ url: parsed, auth: new Headers(init.headers).get('authorization') ?? undefined });

      if (parsed.hostname === 'oauth2.googleapis.com') {
        return jsonResponse({ access_token: 'access-token', expires_in: 3600, token_type: 'Bearer' });
      }

      return jsonResponse({
        items: [
          {
            id: 'evt-1',
            summary: 'Design Review',
            status: 'confirmed',
            start: { dateTime: '2026-05-29T10:30:00+03:00' },
            end: { dateTime: '2026-05-29T11:30:00+03:00' },
          },
        ],
      });
    },
  });

  const events = await client.listEventsForDate('2026-05-29', 'Europe/Kyiv');

  assert.equal(events.length, 1);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url.hostname, 'oauth2.googleapis.com');
  assert.equal(requests[1].url.hostname, 'www.googleapis.com');
  assert.equal(requests[1].auth, 'Bearer access-token');
});

test('GoogleCalendarClient uses cached events for repeated date requests', async () => {
  let calls = 0;
  const client = new GoogleCalendarClient({
    config: {
      ...baseConfig,
      apiKey: 'public-key',
    },
    fetcher: async () => {
      calls += 1;
      return jsonResponse({ items: [] });
    },
  });

  await client.listEventsForDate('2026-05-29', 'Europe/Kyiv');
  await client.listEventsForDate('2026-05-29', 'Europe/Kyiv');

  assert.equal(calls, 1);
});
