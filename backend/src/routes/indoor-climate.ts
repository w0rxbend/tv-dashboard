import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { airGradient } from '../services/airgradient.js';
import { mapAirGradientSnapshot, rangeValues } from '../services/airgradient-view.js';
import { upstreamError } from '../lib/upstream-error.js';
import { upstreamErrorResponses } from '../lib/api-error.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const IndoorClimateSchema = z.object({
  sensor_location: z.string().openapi({ example: 'Living Room' }),
  temperature:     z.number().openapi({ example: 21.4, description: 'Indoor temperature °C' }),
  humidity:        z.number().openapi({ example: 46, description: 'Relative humidity %' }),
  co2:             z.number().openapi({ example: 612, description: 'CO₂ ppm' }),
  voc:             z.number().openapi({ example: 120, description: 'TVOC index' }),
  nox:             z.number().openapi({ example: 1, description: 'NOx index' }),
  sparklines: z.object({
    co2: z.array(z.number()),
    voc: z.array(z.number()),
    nox: z.array(z.number()),
  }).openapi({ description: 'Trend sparklines for CO₂, TVOC, and NOx' }),
}).openapi('IndoorClimate');

const IndoorClimateResponseSchema = z.object({
  data: IndoorClimateSchema,
}).openapi('IndoorClimateResponse');

// ─── Routes ──────────────────────────────────────────────────────────────────

const getIndoorClimateRoute = createRoute({
  method:      'get',
  path:        '/v1/indoor-climate',
  tags:        ['Indoor Climate'],
  summary:     'Get current indoor climate readings',
  description: 'Returns indoor temperature, humidity, CO₂, TVOC, and NOx from the AirGradient sensor array.',
  responses: {
    200: {
      content:     { 'application/json': { schema: IndoorClimateResponseSchema } },
      description: 'Indoor climate data',
    },
    ...upstreamErrorResponses,
  },
});

const handleGetIndoorClimate: RouteHandler<typeof getIndoorClimateRoute> = async (c) => {
  try {
    const [current, co2, voc, nox] = await Promise.all([
      airGradient.current(),
      airGradient.range('co2'),
      airGradient.range('voc'),
      airGradient.range('nox'),
    ]);
    const snapshot = mapAirGradientSnapshot(current);

    return c.json({
      data: {
        sensor_location: 'AirGradient',
        temperature:     snapshot.temperature,
        humidity:        snapshot.humidity,
        co2:             snapshot.co2,
        voc:             snapshot.voc,
        nox:             snapshot.nox,
        sparklines: {
          co2: rangeValues(co2),
          voc: rangeValues(voc),
          nox: rangeValues(nox),
        },
      },
    });
  } catch (err) {
    return upstreamError(err);
  }
};

export function registerIndoorClimateRoutes(app: OpenAPIHono) {
  app.openapi(getIndoorClimateRoute, handleGetIndoorClimate);
}
