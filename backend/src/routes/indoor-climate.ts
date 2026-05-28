import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter, makeSeries } from '../lib/mock.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const IndoorClimateSchema = z.object({
  sensor_location: z.string().openapi({ example: 'Living Room' }),
  temperature:     z.number().openapi({ example: 21.4, description: 'Indoor temperature °C' }),
  humidity:        z.number().openapi({ example: 46, description: 'Relative humidity %' }),
  co2:             z.number().openapi({ example: 612, description: 'CO₂ ppm' }),
  voc:             z.number().openapi({ example: 0.42, description: 'tVOC mg/m³' }),
  sparklines: z.object({
    co2: z.array(z.number()),
    voc: z.array(z.number()),
  }).openapi({ description: 'Trend sparklines for CO₂ and VOC' }),
}).openapi('IndoorClimate');

const IndoorClimateResponseSchema = z.object({
  data: IndoorClimateSchema,
}).openapi('IndoorClimateResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getIndoorClimateMock() {
  return {
    data: {
      sensor_location: 'Living Room',
      temperature:     jitter(21.4, 0.3),
      humidity:        jitter(46, 2),
      co2:             Math.round(jitter(612, 25)),
      voc:             jitter(0.42, 0.06),
      sparklines: {
        co2: makeSeries(28, 612, 80, 27),
        voc: makeSeries(28, 0.42, 0.15, 31),
      },
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getIndoorClimateRoute = createRoute({
  method:      'get',
  path:        '/v1/indoor-climate',
  tags:        ['Indoor Climate'],
  summary:     'Get current indoor climate readings',
  description: 'Returns indoor temperature, humidity, CO₂, and tVOC from the living room sensor array.',
  responses: {
    200: {
      content:     { 'application/json': { schema: IndoorClimateResponseSchema } },
      description: 'Indoor climate data',
    },
  },
});

export function registerIndoorClimateRoutes(app: OpenAPIHono) {
  app.openapi(getIndoorClimateRoute, (c) => c.json(getIndoorClimateMock()));
}
