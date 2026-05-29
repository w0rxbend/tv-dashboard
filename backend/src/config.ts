// ─── Application configuration ───────────────────────────────────────────────
// All values are driven by environment variables; the defaults point to Kyiv.

function requireFiniteNumber(envVar: string, fallback: number, { min, max }: { min?: number; max?: number } = {}): number {
  const raw = process.env[envVar];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${envVar}="${raw}" is not a valid number`);
  if (min !== undefined && n < min) throw new Error(`${envVar}="${raw}" must be >= ${min}`);
  if (max !== undefined && n > max) throw new Error(`${envVar}="${raw}" must be <= ${max}`);
  return n;
}

function requirePort(envVar: string, fallback: number): number {
  const port = requireFiniteNumber(envVar, fallback, { min: 1, max: 65535 });
  if (!Number.isInteger(port)) throw new Error(`${envVar} must be an integer port`);
  return port;
}

function requireInteger(envVar: string, fallback: number, { min, max }: { min?: number; max?: number } = {}): number {
  const n = requireFiniteNumber(envVar, fallback, { min, max });
  if (!Number.isInteger(n)) throw new Error(`${envVar} must be an integer`);
  return n;
}

function requireTimezone(envVar: string, fallback: string): string {
  const timezone = process.env[envVar] ?? fallback;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    throw new Error(`${envVar}="${timezone}" is not a valid IANA timezone`);
  }
}

function csv(envVar: string, fallback: string[]): string[] {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

function optionalString(envVar: string): string | undefined {
  const raw = process.env[envVar]?.trim();
  return raw || undefined;
}

function requireOrigins(envVar: string, fallback: string[]): string[] {
  const origins = csv(envVar, fallback);
  for (const origin of origins) {
    if (origin === '*') continue;
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`${envVar} contains invalid origin "${origin}"`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`${envVar} origin "${origin}" must use http or https`);
    }
  }
  return origins;
}

function requireUrl(envVar: string, fallback: string): string {
  const value = optionalString(envVar) ?? fallback;
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`${envVar}="${value}" is not a valid URL`);
  }
}

function requireBaseUrl(envVar: string, fallback: string): string {
  const value = requireUrl(envVar, fallback);
  return value.endsWith('/') ? value : `${value}/`;
}

function requirePattern(envVar: string, fallback: string, pattern: RegExp): string {
  const value = optionalString(envVar) ?? fallback;
  if (!pattern.test(value)) throw new Error(`${envVar}="${value}" is invalid`);
  return value;
}

const googleCalendarClientId = optionalString('GOOGLE_CALENDAR_CLIENT_ID');
const googleCalendarClientSecret = optionalString('GOOGLE_CALENDAR_CLIENT_SECRET');
const googleCalendarRefreshToken = optionalString('GOOGLE_CALENDAR_REFRESH_TOKEN');
const googleCalendarOauthVars = [
  googleCalendarClientId,
  googleCalendarClientSecret,
  googleCalendarRefreshToken,
];

if (googleCalendarOauthVars.some(Boolean) && !googleCalendarOauthVars.every(Boolean)) {
  throw new Error('GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN must be set together');
}

export const config = {
  server: {
    port: requirePort('PORT', 3001),
    corsOrigins: requireOrigins('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:4173']),
  },
  location: {
    city:      process.env.LOCATION_CITY     ?? 'Kyiv',
    region:    process.env.LOCATION_REGION   ?? 'Kyiv · UA',
    country:   process.env.LOCATION_COUNTRY  ?? 'UA',
    timezone:  requireTimezone('LOCATION_TIMEZONE', 'Europe/Kyiv'),
    latitude:  requireFiniteNumber('LOCATION_LAT', 50.4501, { min: -90, max: 90 }),
    longitude: requireFiniteNumber('LOCATION_LON', 30.5234, { min: -180, max: 180 }),
  },
  upstream: {
    openMeteoTimeoutMs: requireInteger('OPEN_METEO_TIMEOUT_MS', 8_000, { min: 100, max: 60_000 }),
    openMeteoRetries: requireInteger('OPEN_METEO_RETRIES', 1, { min: 0, max: 5 }),
    openMeteoRetryBackoffMs: requireInteger('OPEN_METEO_RETRY_BACKOFF_MS', 100, { min: 0, max: 5_000 }),
    weatherTtlMs: requireInteger('OPEN_METEO_WEATHER_TTL_MS', 15 * 60 * 1_000, { min: 1_000, max: 24 * 60 * 60 * 1_000 }),
    staleFallbackMs: requireInteger('OPEN_METEO_STALE_FALLBACK_MS', 2 * 60 * 60 * 1_000, { min: 0, max: 7 * 24 * 60 * 60 * 1_000 }),
  },
  googleCalendar: {
    calendarId: optionalString('GOOGLE_CALENDAR_ID') ?? 'primary',
    apiKey: optionalString('GOOGLE_CALENDAR_API_KEY'),
    clientId: googleCalendarClientId,
    clientSecret: googleCalendarClientSecret,
    refreshToken: googleCalendarRefreshToken,
    timeoutMs: requireInteger('GOOGLE_CALENDAR_TIMEOUT_MS', 8_000, { min: 100, max: 60_000 }),
    ttlMs: requireInteger('GOOGLE_CALENDAR_TTL_MS', 5 * 60 * 1_000, { min: 1_000, max: 24 * 60 * 60 * 1_000 }),
    staleFallbackMs: requireInteger('GOOGLE_CALENDAR_STALE_FALLBACK_MS', 60 * 60 * 1_000, { min: 0, max: 7 * 24 * 60 * 60 * 1_000 }),
    maxResults: requireInteger('GOOGLE_CALENDAR_MAX_RESULTS', 10, { min: 1, max: 50 }),
  },
  airGradient: {
    apiBaseUrl: requireBaseUrl('AIRGRADIENT_API_BASE_URL', 'http://localhost:8080/api/'),
    timeoutMs: requireInteger('AIRGRADIENT_TIMEOUT_MS', 8_000, { min: 100, max: 60_000 }),
    ttlMs: requireInteger('AIRGRADIENT_TTL_MS', 10_000, { min: 1_000, max: 24 * 60 * 60 * 1_000 }),
    rangeTtlMs: requireInteger('AIRGRADIENT_RANGE_TTL_MS', 30_000, { min: 1_000, max: 24 * 60 * 60 * 1_000 }),
    staleFallbackMs: requireInteger('AIRGRADIENT_STALE_FALLBACK_MS', 5 * 60 * 1_000, { min: 0, max: 7 * 24 * 60 * 60 * 1_000 }),
    rangeWindow: requirePattern('AIRGRADIENT_RANGE_WINDOW', '12h', /^\d+[hd]$/),
    rangeStep: requirePattern('AIRGRADIENT_RANGE_STEP', '15m', /^\d+[smh]$/),
  },
};
