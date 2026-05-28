import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { config } from '../config.js';
import {
  fetchWeatherFromAPI,
  wmoToCondition,
  degreesToCardinal,
  uvMeta,
} from '../services/open-meteo.js';
import { upstreamError } from '../lib/upstream-error.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  city:   z.string().openapi({ example: 'Kyiv' }),
  region: z.string().openapi({ example: 'Kyiv · UA' }),
}).openapi('Location');

const CurrentWeatherSchema = z.object({
  temperature:     z.number().openapi({ example: 19.4, description: 'Temperature in °C' }),
  feels_like:      z.number().openapi({ example: 18.2, description: 'Apparent temperature in °C' }),
  condition:       z.string().openapi({ example: 'partly_cloudy' }),
  condition_label: z.string().openapi({ example: 'Partly cloudy' }),
  icon:            z.string().openapi({ example: 'partly_cloudy_day', description: 'Material Symbols icon name (small uses)' }),
  weather_icon:    z.string().openapi({ example: 'partly_cloudy', description: 'Animated SVG icon slug — resolves to /weather/{slug}.svg' }),
  wind_speed:      z.number().openapi({ example: 8, description: 'Wind speed in km/h' }),
  wind_direction:  z.string().openapi({ example: 'NE', description: 'Cardinal/intercardinal wind direction' }),
  humidity:        z.number().openapi({ example: 54, description: 'Relative humidity %' }),
  uv_index:        z.number().openapi({ example: 4, description: 'UV index (WHO scale 0–11+)' }),
  uv_label:        z.string().openapi({ example: 'Moderate', description: 'WHO UV risk category label' }),
  uv_advice:       z.string().openapi({ example: 'Wear sunscreen', description: 'Short protective action advice' }),
  location:        LocationSchema,
}).openapi('CurrentWeather');

const ForecastDaySchema = z.object({
  day:          z.string().openapi({ example: 'TUE' }),
  icon:         z.string().openapi({ example: 'wb_sunny', description: 'Material Symbols icon name' }),
  weather_icon: z.string().openapi({ example: 'clear', description: 'Animated SVG icon slug' }),
  high:         z.number().openapi({ example: 22, description: 'High temp in °C' }),
  low:          z.number().openapi({ example: 14, description: 'Low temp in °C' }),
}).openapi('ForecastDay');

const WeatherResponseSchema = z.object({
  data: z.object({
    current:  CurrentWeatherSchema,
    forecast: z.array(ForecastDaySchema).openapi({ description: '7-day forecast' }),
  }),
}).openapi('WeatherResponse');

// ─── Route definition ─────────────────────────────────────────────────────────

const getWeatherRoute = createRoute({
  method:      'get',
  path:        '/v1/weather',
  tags:        ['Weather'],
  summary:     'Get current weather and forecast',
  description: [
    'Returns current outdoor conditions and a 7-day forecast for the configured location.',
    '',
    '**503** is returned when the upstream Open-Meteo API is unreachable.',
  ].join('\n'),
  responses: {
    200: {
      content:     { 'application/json': { schema: WeatherResponseSchema } },
      description: 'Current weather data',
    },
  },
});

// ─── Handler ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

const handleGetWeather: RouteHandler<typeof getWeatherRoute> = async (c) => {
  const { latitude, longitude, city, region } = config.location;

  let raw;
  try {
    raw = await fetchWeatherFromAPI(latitude, longitude);
  } catch (err) {
    return upstreamError(err instanceof Error ? err.message : 'Unknown upstream error');
  }

  const cur   = raw.current;
  const daily = raw.daily;

  const uvIndex = Math.round(cur.uv_index);
  const cond    = wmoToCondition(cur.weather_code);

  const forecast = daily.time.map((dateStr, i) => {
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
    const fc = wmoToCondition(daily.weather_code[i]);
    return {
      day:          DAY_LABELS[dayOfWeek],
      icon:         fc.icon,
      weather_icon: fc.weather_icon,
      high:         Math.round(daily.temperature_2m_max[i]),
      low:          Math.round(daily.temperature_2m_min[i]),
    };
  });

  return c.json({
    data: {
      current: {
        temperature:     cur.temperature_2m,
        feels_like:      cur.apparent_temperature,
        condition:       cond.condition,
        condition_label: cond.condition_label,
        icon:            cond.icon,
        weather_icon:    cond.weather_icon,
        wind_speed:      cur.wind_speed_10m,
        wind_direction:  degreesToCardinal(cur.wind_direction_10m),
        humidity:        cur.relative_humidity_2m,
        uv_index:        uvIndex,
        ...uvMeta(uvIndex),
        location: { city, region },
      },
      forecast,
    },
  });
};

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerWeatherRoutes(app: OpenAPIHono) {
  app.openapi(getWeatherRoute, handleGetWeather);
}
