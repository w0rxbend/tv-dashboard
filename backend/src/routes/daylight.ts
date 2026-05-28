import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const DaylightSchema = z.object({
  date:     z.string().openapi({ example: '2026-05-28', description: 'ISO 8601 date' }),
  sunrise:  z.string().openapi({ example: '05:24', description: 'Local HH:MM' }),
  sunset:   z.string().openapi({ example: '21:42', description: 'Local HH:MM' }),
  progress: z.number().min(0).max(1).openapi({
    example: 0.62,
    description: 'Fraction of the daylight window elapsed (0 = sunrise, 1 = sunset)',
  }),
  day_length_hours: z.number().openapi({ example: 16.3, description: 'Total daylight hours' }),
}).openapi('Daylight');

const DaylightResponseSchema = z.object({
  data: DaylightSchema,
}).openapi('DaylightResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getDaylightMock() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Approximate Stockholm summer daylight
  const sunriseMin = 5 * 60 + 24;   // 05:24
  const sunsetMin  = 21 * 60 + 42;  // 21:42
  const nowMin     = now.getHours() * 60 + now.getMinutes();
  const dayLen     = sunsetMin - sunriseMin;
  const elapsed    = Math.min(1, Math.max(0, (nowMin - sunriseMin) / dayLen));

  return {
    data: {
      date:             today,
      sunrise:          '05:24',
      sunset:           '21:42',
      progress:         +elapsed.toFixed(4),
      day_length_hours: +(dayLen / 60).toFixed(2),
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getDaylightRoute = createRoute({
  method:      'get',
  path:        '/v1/daylight',
  tags:        ['Daylight'],
  summary:     'Get daylight info for today',
  description: 'Returns sunrise, sunset, and current daylight progress for the configured location.',
  responses: {
    200: {
      content:     { 'application/json': { schema: DaylightResponseSchema } },
      description: 'Daylight data',
    },
  },
});

export function registerDaylightRoutes(app: OpenAPIHono) {
  app.openapi(getDaylightRoute, (c) => c.json(getDaylightMock()));
}
