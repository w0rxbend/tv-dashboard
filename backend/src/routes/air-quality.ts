import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono, RouteHandler } from '@hono/zod-openapi';
import { airGradient } from '../services/airgradient.js';
import { mapAirQualityView, mapAirQualityReadings } from '../services/air-quality-view.js';
import { upstreamError } from '../lib/upstream-error.js';
import { upstreamErrorResponses } from '../lib/api-error.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const AqiCategorySchema = z.object({
  name:      z.string().openapi({ example: 'Good' }),
  color:     z.string().openapi({ example: '#82DBA6' }),
  container: z.string().openapi({ example: 'var(--md-good-container)' }),
  on:        z.string().openapi({ example: 'var(--md-on-good-container)' }),
}).openapi('AqiCategory');

const SparklineSchema = z.array(z.number()).openapi({
  description: '28-point trend series for sparkline rendering',
});

const AirQualitySchema = z.object({
  aqi:      z.number().openapi({ example: 42, description: 'US EPA AQI (0–500)' }),
  category: AqiCategorySchema,
  pm25:     z.number().openapi({ example: 8.2, description: 'PM2.5 µg/m³' }),
  co2:      z.number().openapi({ example: 612, description: 'CO₂ ppm' }),
  voc:      z.number().openapi({ example: 120, description: 'TVOC index' }),
  nox:      z.number().openapi({ example: 1, description: 'NOx index' }),
  message:  z.string().openapi({ example: 'Air quality is Good' }),
  sparklines: z.object({
    pm25: SparklineSchema,
    co2:  SparklineSchema,
    voc:  SparklineSchema,
    nox:  SparklineSchema,
  }).openapi({ description: 'Historical trend data for each metric' }),
}).openapi('AirQuality');

const AirQualityResponseSchema = z.object({
  data: AirQualitySchema,
}).openapi('AirQualityResponse');

const ReadingsSchema = z.object({
  window:     z.string().openapi({ example: '12h', description: 'Time window covered' }),
  resolution: z.string().openapi({ example: '15min', description: 'Sample resolution' }),
  count:      z.number().openapi({ example: 48, description: 'Number of data points per channel' }),
  series: z.object({
    pm25: z.array(z.number()),
    co2:  z.array(z.number()),
    voc:  z.array(z.number()),
    nox:  z.array(z.number()),
  }).openapi({ description: 'Time-ordered reading arrays per metric' }),
}).openapi('AirQualityReadings');

const ReadingsResponseSchema = z.object({
  data: ReadingsSchema,
}).openapi('AirQualityReadingsResponse');

// ─── Routes ──────────────────────────────────────────────────────────────────

const getAirQualityRoute = createRoute({
  method:      'get',
  path:        '/v1/air-quality',
  tags:        ['Air Quality'],
  summary:     'Get current air quality readings',
  description: [
    'Returns current indoor AirGradient PM2.5, CO₂, TVOC, and NOx readings.',
    '',
    'US AQI is derived from the AirGradient PM2.5 concentration using EPA PM2.5 breakpoints.',
    '',
    '**503** is returned when the AirGradient observability backend is unreachable.',
  ].join('\n'),
  responses: {
    200: {
      content:     { 'application/json': { schema: AirQualityResponseSchema } },
      description: 'Current air quality data',
    },
    ...upstreamErrorResponses,
  },
});

const getReadingsRoute = createRoute({
  method:      'get',
  path:        '/v1/air-quality/readings',
  tags:        ['Air Quality'],
  summary:     'Get historical AirGradient readings',
  description: 'Returns time-series data for PM2.5, CO₂, TVOC, and NOx channels over the configured AirGradient range.',
  responses: {
    200: {
      content:     { 'application/json': { schema: ReadingsResponseSchema } },
      description: 'AirGradient telemetry history',
    },
    ...upstreamErrorResponses,
  },
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

const handleGetAirQuality: RouteHandler<typeof getAirQualityRoute> = async (c) => {
  try {
    const [current, pm25, co2, voc, nox] = await Promise.all([
      airGradient.current(),
      airGradient.range('pm25'),
      airGradient.range('co2'),
      airGradient.range('voc'),
      airGradient.range('nox'),
    ]);
    return c.json({ data: mapAirQualityView(current, { pm25, co2, voc, nox }) });
  } catch (err) {
    return upstreamError(err);
  }
};

const handleGetReadings: RouteHandler<typeof getReadingsRoute> = async (c) => {
  try {
    const ranges = await Promise.all([
      airGradient.range('pm25'),
      airGradient.range('co2'),
      airGradient.range('voc'),
      airGradient.range('nox'),
    ]);
    return c.json({ data: mapAirQualityReadings(ranges) });
  } catch (err) {
    return upstreamError(err);
  }
};

export function registerAirQualityRoutes(app: OpenAPIHono) {
  app.openapi(getAirQualityRoute, handleGetAirQuality);
  app.openapi(getReadingsRoute,   handleGetReadings);
}
