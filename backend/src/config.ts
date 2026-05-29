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
    airQualityTtlMs: requireInteger('OPEN_METEO_AIR_QUALITY_TTL_MS', 30 * 60 * 1_000, { min: 1_000, max: 24 * 60 * 60 * 1_000 }),
    staleFallbackMs: requireInteger('OPEN_METEO_STALE_FALLBACK_MS', 2 * 60 * 60 * 1_000, { min: 0, max: 7 * 24 * 60 * 60 * 1_000 }),
  },
};
