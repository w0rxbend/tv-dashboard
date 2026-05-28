import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter } from '../lib/mock.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const EnergySchema = z.object({
  consumption_w:     z.number().openapi({ example: 412, description: 'Current home consumption in Watts' }),
  solar_generation_w: z.number().openapi({ example: 264, description: 'Current solar generation in Watts' }),
  solar_coverage_pct: z.number().openapi({ example: 64, description: 'Percentage of consumption covered by solar' }),
  grid_import_w:     z.number().openapi({ example: 148, description: 'Power drawn from the grid (positive = import)' }),
}).openapi('Energy');

const EnergyResponseSchema = z.object({
  data: EnergySchema,
}).openapi('EnergyResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getEnergyMock() {
  const consumption = Math.round(jitter(412, 30));
  const solar = Math.round(jitter(264, 25));
  const coverage = Math.round((solar / consumption) * 100);
  return {
    data: {
      consumption_w:      consumption,
      solar_generation_w: solar,
      solar_coverage_pct: Math.min(100, coverage),
      grid_import_w:      Math.max(0, consumption - solar),
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getEnergyRoute = createRoute({
  method:      'get',
  path:        '/v1/energy',
  tags:        ['Energy'],
  summary:     'Get current home energy status',
  description: 'Returns current home energy consumption, solar generation, and grid import/export.',
  responses: {
    200: {
      content:     { 'application/json': { schema: EnergyResponseSchema } },
      description: 'Current energy data',
    },
  },
});

export function registerEnergyRoutes(app: OpenAPIHono) {
  app.openapi(getEnergyRoute, (c) => c.json(getEnergyMock()));
}
