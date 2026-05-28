import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  city:      z.string().openapi({ example: 'Stockholm' }),
  region:    z.string().openapi({ example: 'Södermalm · SE' }),
  country:   z.string().openapi({ example: 'SE' }),
  timezone:  z.string().openapi({ example: 'Europe/Stockholm' }),
  latitude:  z.number().openapi({ example: 59.3147 }),
  longitude: z.number().openapi({ example: 18.0699 }),
}).openapi('Location');

const LocationResponseSchema = z.object({
  data: LocationSchema,
}).openapi('LocationResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getLocationMock() {
  return {
    data: {
      city:      'Stockholm',
      region:    'Södermalm · SE',
      country:   'SE',
      timezone:  'Europe/Stockholm',
      latitude:  59.3147,
      longitude: 18.0699,
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getLocationRoute = createRoute({
  method:      'get',
  path:        '/v1/location',
  tags:        ['Location'],
  summary:     'Get configured location',
  description: 'Returns the dashboard location settings. Changes infrequently — suitable for once-per-day or on-demand fetching.',
  responses: {
    200: {
      content:     { 'application/json': { schema: LocationResponseSchema } },
      description: 'Location data',
    },
  },
});

export function registerLocationRoutes(app: OpenAPIHono) {
  app.openapi(getLocationRoute, (c) => c.json(getLocationMock()));
}
