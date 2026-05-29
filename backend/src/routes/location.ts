import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { config } from '../config.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  city:      z.string().openapi({ example: 'Kyiv' }),
  region:    z.string().openapi({ example: 'Kyiv · UA' }),
  country:   z.string().openapi({ example: 'UA' }),
  timezone:  z.string().openapi({ example: 'Europe/Kyiv' }),
  latitude:  z.number().openapi({ example: 50.4501 }),
  longitude: z.number().openapi({ example: 30.5234 }),
}).openapi('Location');

const LocationResponseSchema = z.object({
  data: LocationSchema,
}).openapi('LocationResponse');

// ─── Route definition ─────────────────────────────────────────────────────────

const getLocationRoute = createRoute({
  method:      'get',
  path:        '/v1/location',
  tags:        ['Location'],
  summary:     'Get configured location',
  description: 'Returns the dashboard location driven by LOCATION_* environment variables. Changes infrequently — suitable for once-per-session fetching.',
  responses: {
    200: {
      content:     { 'application/json': { schema: LocationResponseSchema } },
      description: 'Location data',
    },
  },
});

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerLocationRoutes(app: OpenAPIHono) {
  app.openapi(getLocationRoute, (c) => c.json({ data: config.location }));
}
