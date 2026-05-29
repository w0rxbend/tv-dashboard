// ─── Open-Meteo API service ───────────────────────────────────────────────────
// Uses Node 18+ built-in fetch.  No extra npm packages required.

import { z } from 'zod';
import { config } from '../config.js';
import { UpstreamError } from '../lib/api-error.js';

// ─── TTL cache ───────────────────────────────────────────────────────────────

interface CacheEntry<T> { value: T; expiresAt: number; staleUntil: number; }

class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.value;
  }

  getStale(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.staleUntil) { this.store.delete(key); return undefined; }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number, staleMs: number): void {
    const now = Date.now();
    this.store.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + ttlMs + staleMs });
  }
}

const weatherCache    = new TtlCache<OpenMeteoWeatherResponse>();
const airQualityCache = new TtlCache<OpenMeteoAirQualityResponse>();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenMeteoWeatherResponse {
  current: {
    temperature_2m:        number;
    relative_humidity_2m:  number;
    apparent_temperature:  number;
    weather_code:          number;
    wind_speed_10m:        number;
    wind_direction_10m:    number;
    uv_index:              number;
  };
  daily: {
    time:               string[];
    weather_code:       number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise:            string[];
    sunset:             string[];
    uv_index_max:       number[];
  };
}

export interface OpenMeteoAirQualityResponse {
  current: {
    european_aqi: number;
    us_aqi:       number;
    pm2_5:        number;
    pm10:         number;
  };
}

const OpenMeteoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const OpenMeteoDateTimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

const OpenMeteoWeatherSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    uv_index: z.number(),
  }),
  daily: z.object({
    time: z.array(OpenMeteoDateSchema).min(1),
    weather_code: z.array(z.number()).min(1),
    temperature_2m_max: z.array(z.number()).min(1),
    temperature_2m_min: z.array(z.number()).min(1),
    sunrise: z.array(OpenMeteoDateTimeSchema).min(1),
    sunset: z.array(OpenMeteoDateTimeSchema).min(1),
    uv_index_max: z.array(z.number()).min(1),
  }).refine((daily) => {
    const len = daily.time.length;
    return [
      daily.weather_code,
      daily.temperature_2m_max,
      daily.temperature_2m_min,
      daily.sunrise,
      daily.sunset,
      daily.uv_index_max,
    ].every((values) => values.length === len);
  }, 'Expected Open-Meteo daily arrays to have matching lengths'),
});

const OpenMeteoAirQualitySchema = z.object({
  current: z.object({
    european_aqi: z.number(),
    us_aqi: z.number(),
    pm2_5: z.number(),
    pm10: z.number(),
  }),
});

// ─── WMO weather code mapping ─────────────────────────────────────────────────

export interface WeatherCondition {
  condition:       string;
  condition_label: string;
  icon:            string;
  weather_icon:    string;
}

export function wmoToCondition(code: number): WeatherCondition {
  if (code === 0)                                         return { condition: 'clear',             condition_label: 'Clear sky',              icon: 'wb_sunny',          weather_icon: 'clear'         };
  if (code === 1)                                         return { condition: 'mainly_clear',      condition_label: 'Mainly clear',           icon: 'wb_sunny',          weather_icon: 'clear'         };
  if (code === 2)                                         return { condition: 'partly_cloudy',     condition_label: 'Partly cloudy',          icon: 'partly_cloudy_day', weather_icon: 'partly_cloudy' };
  if (code === 3)                                         return { condition: 'overcast',          condition_label: 'Overcast',               icon: 'cloud',             weather_icon: 'cloudy'        };
  if (code === 45 || code === 48)                         return { condition: 'fog',               condition_label: 'Foggy',                  icon: 'foggy',             weather_icon: 'fog'           };
  if (code === 51 || code === 53 || code === 55)          return { condition: 'drizzle',           condition_label: 'Drizzle',                icon: 'grain',             weather_icon: 'drizzle'       };
  if (code === 61 || code === 63 || code === 65)          return { condition: 'rain',              condition_label: 'Rain',                   icon: 'rainy',             weather_icon: 'rainy'         };
  if (code === 71 || code === 73 || code === 75)          return { condition: 'snow',              condition_label: 'Snow',                   icon: 'weather_snowy',     weather_icon: 'snow'          };
  if (code === 77)                                        return { condition: 'snow_grains',       condition_label: 'Snow grains',            icon: 'snowing',           weather_icon: 'snow'          };
  if (code === 80 || code === 81 || code === 82)          return { condition: 'rain_showers',      condition_label: 'Rain showers',           icon: 'rainy',             weather_icon: 'rainy'         };
  if (code === 85 || code === 86)                         return { condition: 'snow_showers',      condition_label: 'Snow showers',           icon: 'weather_snowy',     weather_icon: 'snow'          };
  if (code === 95)                                        return { condition: 'thunderstorm',      condition_label: 'Thunderstorm',           icon: 'thunderstorm',      weather_icon: 'thunderstorm'  };
  if (code === 96 || code === 99)                         return { condition: 'thunderstorm_hail', condition_label: 'Thunderstorm with hail', icon: 'thunderstorm',      weather_icon: 'thunderstorm'  };
  return                                                         { condition: 'cloudy',            condition_label: 'Cloudy',                 icon: 'cloud',             weather_icon: 'cloudy'        };
}

// ─── Wind direction helper ────────────────────────────────────────────────────

const CARDINALS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'] as const;

export function degreesToCardinal(degrees: number): string {
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return CARDINALS[index];
}

// ─── UV label helper ──────────────────────────────────────────────────────────

export function uvMeta(index: number): { uv_label: string; uv_advice: string } {
  if (index <= 2)  return { uv_label: 'Low',       uv_advice: 'No protection needed' };
  if (index <= 5)  return { uv_label: 'Moderate',  uv_advice: 'Wear sunscreen'       };
  if (index <= 7)  return { uv_label: 'High',      uv_advice: 'Seek shade midday'    };
  if (index <= 10) return { uv_label: 'Very High', uv_advice: 'Cover up outdoors'    };
  return                  { uv_label: 'Extreme',   uv_advice: 'Avoid sun exposure'   };
}

// ─── Fetch functions (with caching) ──────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryBackoffMs(attempt: number): number {
  return config.upstream.openMeteoRetryBackoffMs * 2 ** attempt;
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.upstream.openMeteoRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.upstream.openMeteoTimeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        const message = `Open-Meteo API returned ${res.status} ${res.statusText}`;
        if (retryable && attempt < config.upstream.openMeteoRetries) {
          lastError = new UpstreamError(message);
          await delay(retryBackoffMs(attempt));
          continue;
        }
        throw new UpstreamError(message, retryable ? 503 : 502, retryable ? 'upstream_error' : 'upstream_bad_status');
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof UpstreamError && err.code === 'upstream_bad_status') throw err;

      const timedOut = err instanceof Error && err.name === 'AbortError';
      lastError = timedOut
        ? new UpstreamError('Open-Meteo request timed out', 504, 'upstream_timeout')
        : err;

      if (attempt >= config.upstream.openMeteoRetries) break;
      await delay(retryBackoffMs(attempt));
    }
  }

  if (lastError instanceof UpstreamError) throw lastError;
  if (lastError instanceof Error) throw new UpstreamError(lastError.message);
  throw new UpstreamError('Open-Meteo request failed');
}

function parseUpstream<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  throw new UpstreamError(
    'Open-Meteo response did not match the expected shape',
    502,
    'upstream_bad_response',
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  );
}

export async function fetchWeatherFromAPI(
  lat: number,
  lon: number,
): Promise<OpenMeteoWeatherResponse> {
  const cacheKey = `weather:${lat},${lon}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude:      String(lat),
    longitude:     String(lon),
    current:       'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
    daily:         'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
    timezone:      'auto',
    forecast_days: '7',
  });

  try {
    const payload = await fetchJsonWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data = parseUpstream(OpenMeteoWeatherSchema, payload);
    weatherCache.set(cacheKey, data, config.upstream.weatherTtlMs, config.upstream.staleFallbackMs);
    return data;
  } catch (err) {
    const stale = weatherCache.getStale(cacheKey);
    if (stale) return stale;
    throw err;
  }
}

export async function fetchAirQualityFromAPI(
  lat: number,
  lon: number,
): Promise<OpenMeteoAirQualityResponse> {
  const cacheKey = `aq:${lat},${lon}`;
  const cached = airQualityCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude:  String(lat),
    longitude: String(lon),
    current:   'european_aqi,us_aqi,pm2_5,pm10',
    timezone:  'auto',
  });

  try {
    const payload = await fetchJsonWithTimeout(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    const data = parseUpstream(OpenMeteoAirQualitySchema, payload);
    airQualityCache.set(cacheKey, data, config.upstream.airQualityTtlMs, config.upstream.staleFallbackMs);
    return data;
  } catch (err) {
    const stale = airQualityCache.getStale(cacheKey);
    if (stale) return stale;
    throw err;
  }
}
