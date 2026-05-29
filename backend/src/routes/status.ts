import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { getSystemStatus } from '../services/system-status.js';

const ServiceStatusSchema = z.object({
  key: z.string().openapi({ example: 'weather' }),
  label: z.string().openapi({ example: 'Weather' }),
  status: z.enum(['operational', 'degraded', 'down', 'not_configured']).openapi({ example: 'operational' }),
  message: z.string().openapi({ example: 'Open-Meteo reachable' }),
  checked_at: z.string().datetime().openapi({ example: '2026-05-29T12:00:00.000Z' }),
  details: z.record(z.string(), z.unknown()).optional(),
}).openapi('ServiceStatus');

const StatusResponseSchema = z.object({
  data: z.object({
    status: z.enum(['operational', 'degraded', 'down']).openapi({ example: 'degraded' }),
    checked_at: z.string().datetime().openapi({ example: '2026-05-29T12:00:00.000Z' }),
    services: z.array(ServiceStatusSchema),
  }),
}).openapi('StatusResponse');

const getStatusRoute = createRoute({
  method: 'get',
  path: '/v1/status',
  tags: ['Status'],
  summary: 'Get dashboard dependency status',
  description: 'Returns health information for the dashboard dependencies without failing the whole request when one dependency is unavailable.',
  responses: {
    200: {
      content: { 'application/json': { schema: StatusResponseSchema } },
      description: 'Dashboard dependency status',
    },
  },
});

const handleGetStatus: RouteHandler<typeof getStatusRoute> = async (c) => {
  const status = await getSystemStatus();
  return c.json({ data: status });
};

export function registerStatusRoutes(app: OpenAPIHono) {
  app.openapi(getStatusRoute, handleGetStatus);
}
