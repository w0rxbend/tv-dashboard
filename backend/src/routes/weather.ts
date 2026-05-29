import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { config } from '../config.js';
import {
  fetchWeatherFromAPI,
} from '../services/open-meteo.js';
import { mapWeatherView } from '../services/weather-view.js';
import { upstreamError } from '../lib/upstream-error.js';
import { upstreamErrorResponses } from '../lib/api-error.js';

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
  wind_degrees:    z.number().min(0).max(360).openapi({ example: 45, description: 'Wind bearing in degrees from north' }),
  wind_direction:  z.string().openapi({ example: 'NE', description: 'Cardinal/intercardinal wind direction' }),
  wind_gust:       z.number().openapi({ example: 18, description: 'Wind gust in km/h' }),
  wind_level:      z.enum(['calm', 'light', 'breezy', 'windy', 'strong']).openapi({ example: 'light', description: 'Stable wind intensity token for clients' }),
  wind_label:      z.string().openapi({ example: 'Light', description: 'Human-readable wind intensity label' }),
  wind_advice:     z.string().openapi({ example: 'Light breeze', description: 'Short wind condition note' }),
  humidity:        z.number().openapi({ example: 54, description: 'Relative humidity %' }),
  uv_index:        z.number().openapi({ example: 4, description: 'UV index (WHO scale 0–11+)' }),
  uv_max_today:    z.number().openapi({ example: 5, description: 'Maximum UV index forecast for today' }),
  uv_progress:     z.number().min(0).max(1).openapi({ example: 0.364, description: 'Normalized UV position on the 0–11+ dashboard scale' }),
  uv_level:        z.enum(['low', 'moderate', 'high', 'very_high', 'extreme']).openapi({ example: 'moderate', description: 'Stable UV risk token for clients' }),
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
    ...upstreamErrorResponses,
  },
});

// ─── Handler ──────────────────────────────────────────────────────────────────

const handleGetWeather: RouteHandler<typeof getWeatherRoute> = async (c) => {
  const { latitude, longitude, city, region } = config.location;

  let raw;
  try {
    raw = await fetchWeatherFromAPI(latitude, longitude);
  } catch (err) {
    return upstreamError(err);
  }

  return c.json({
    data: mapWeatherView(raw, { city, region }),
  });
};

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerWeatherRoutes(app: OpenAPIHono) {
  app.openapi(getWeatherRoute, handleGetWeather);
}
