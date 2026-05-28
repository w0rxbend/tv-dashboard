// ─── Open-Meteo API service ───────────────────────────────────────────────────
// Uses Node 18+ built-in fetch.  No extra npm packages required.

// ─── TTL cache ───────────────────────────────────────────────────────────────

interface CacheEntry<T> { value: T; expiresAt: number; }

class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const WEATHER_TTL_MS    = 15 * 60 * 1_000;  // Open-Meteo updates ~every 15 min
const AIR_QUALITY_TTL_MS = 30 * 60 * 1_000; // AQ model updates ~hourly

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

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast API returned ${res.status} ${res.statusText}`);

  const data = await res.json() as OpenMeteoWeatherResponse;
  weatherCache.set(cacheKey, data, WEATHER_TTL_MS);
  return data;
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

  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo air-quality API returned ${res.status} ${res.statusText}`);

  const data = await res.json() as OpenMeteoAirQualityResponse;
  airQualityCache.set(cacheKey, data, AIR_QUALITY_TTL_MS);
  return data;
}
