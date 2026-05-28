import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { config } from '../config.js';
import { fetchWeatherFromAPI } from '../services/open-meteo.js';
import { localNow, hhmm, hhmmToMinutes } from '../lib/time.js';
import { upstreamError } from '../lib/upstream-error.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const DaylightSchema = z.object({
  date:     z.string().openapi({ example: '2026-05-28', description: 'ISO 8601 date in configured timezone' }),
  sunrise:  z.string().openapi({ example: '04:55', description: 'Local HH:MM' }),
  sunset:   z.string().openapi({ example: '20:55', description: 'Local HH:MM' }),
  progress: z.number().min(0).max(1).openapi({
    example: 0.62,
    description: 'Fraction of the daylight window elapsed (0 = sunrise, 1 = sunset)',
  }),
  day_length_hours: z.number().openapi({ example: 16.0, description: 'Total daylight hours' }),
}).openapi('Daylight');

const DaylightResponseSchema = z.object({
  data: DaylightSchema,
}).openapi('DaylightResponse');

// ─── Route definition ─────────────────────────────────────────────────────────

const getDaylightRoute = createRoute({
  method:      'get',
  path:        '/v1/daylight',
  tags:        ['Daylight'],
  summary:     'Get daylight info for today',
  description: [
    'Returns sunrise, sunset, and current daylight progress for the configured location.',
    '',
    'Sunrise and sunset times come from Open-Meteo and are expressed in local time.',
    '',
    '**503** is returned when the upstream Open-Meteo API is unreachable.',
  ].join('\n'),
  responses: {
    200: {
      content:     { 'application/json': { schema: DaylightResponseSchema } },
      description: 'Daylight data',
    },
  },
});

// ─── Handler ──────────────────────────────────────────────────────────────────

const handleGetDaylight: RouteHandler<typeof getDaylightRoute> = async (c) => {
  const { latitude, longitude, timezone } = config.location;

  let raw;
  try {
    raw = await fetchWeatherFromAPI(latitude, longitude);
  } catch (err) {
    return upstreamError(err instanceof Error ? err.message : 'Unknown upstream error');
  }

  const { date, totalMinutes: nowMin } = localNow(timezone);

  const sunrise = hhmm(raw.daily.sunrise[0]);
  const sunset  = hhmm(raw.daily.sunset[0]);

  const sunriseMin = hhmmToMinutes(sunrise);
  const sunsetMin  = hhmmToMinutes(sunset);
  const dayLen     = sunsetMin - sunriseMin;
  const elapsed    = Math.min(1, Math.max(0, (nowMin - sunriseMin) / dayLen));

  return c.json({
    data: {
      date,
      sunrise,
      sunset,
      progress:         +elapsed.toFixed(4),
      day_length_hours: +(dayLen / 60).toFixed(2),
    },
  });
};

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerDaylightRoutes(app: OpenAPIHono) {
  app.openapi(getDaylightRoute, handleGetDaylight);
}
