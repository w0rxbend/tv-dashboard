import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter } from '../lib/mock.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  city:   z.string().openapi({ example: 'Stockholm' }),
  region: z.string().openapi({ example: 'Södermalm · SE' }),
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

// ─── Mock data provider ──────────────────────────────────────────────────────

function uvMeta(index: number): { uv_label: string; uv_advice: string } {
  if (index <= 2)  return { uv_label: 'Low',       uv_advice: 'No protection needed' };
  if (index <= 5)  return { uv_label: 'Moderate',  uv_advice: 'Wear sunscreen' };
  if (index <= 7)  return { uv_label: 'High',      uv_advice: 'Seek shade midday' };
  if (index <= 10) return { uv_label: 'Very High', uv_advice: 'Cover up outdoors' };
  return                  { uv_label: 'Extreme',   uv_advice: 'Avoid sun exposure' };
}

function getWeatherMock() {
  const temp     = jitter(19.4, 0.8);
  const uvIndex  = 4;
  return {
    data: {
      current: {
        temperature:     temp,
        feels_like:      +(temp - 1.2).toFixed(2),
        condition:       'partly_cloudy',
        condition_label: 'Partly cloudy',
        icon:            'partly_cloudy_day',
        weather_icon:    'partly_cloudy',
        wind_speed:      jitter(8, 1.5),
        wind_direction:  'NE',
        humidity:        jitter(54, 3),
        uv_index:        uvIndex,
        ...uvMeta(uvIndex),
        location: { city: 'Stockholm', region: 'Södermalm · SE' },
      },
      forecast: [
        { day: 'TUE', icon: 'wb_sunny',          weather_icon: 'clear',          high: 22, low: 14 },
        { day: 'WED', icon: 'partly_cloudy_day', weather_icon: 'partly_cloudy',  high: 24, low: 15 },
        { day: 'THU', icon: 'partly_cloudy_day', weather_icon: 'partly_cloudy',  high: 23, low: 14 },
        { day: 'FRI', icon: 'rainy',             weather_icon: 'rainy',          high: 19, low: 13 },
        { day: 'SAT', icon: 'thunderstorm',      weather_icon: 'thunderstorm',   high: 18, low: 12 },
        { day: 'SUN', icon: 'cloud',             weather_icon: 'cloudy',         high: 20, low: 13 },
        { day: 'MON', icon: 'wb_sunny',          weather_icon: 'clear',          high: 23, low: 15 },
      ],
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getWeatherRoute = createRoute({
  method:      'get',
  path:        '/v1/weather',
  tags:        ['Weather'],
  summary:     'Get current weather and forecast',
  description: 'Returns current outdoor conditions and a 7-day forecast for the configured location.',
  responses: {
    200: {
      content:     { 'application/json': { schema: WeatherResponseSchema } },
      description: 'Current weather data',
    },
  },
});

export function registerWeatherRoutes(app: OpenAPIHono) {
  app.openapi(getWeatherRoute, (c) => c.json(getWeatherMock()));
}
