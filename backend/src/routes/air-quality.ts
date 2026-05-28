import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter, makeSeries } from '../lib/mock.js';

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
  pm10:     z.number().openapi({ example: 14.6, description: 'PM10 µg/m³' }),
  co2:      z.number().openapi({ example: 612, description: 'CO₂ ppm' }),
  voc:      z.number().openapi({ example: 0.42, description: 'tVOC mg/m³' }),
  message:  z.string().openapi({ example: 'Air feels fresh — keep windows open until 14:00' }),
  sparklines: z.object({
    pm25: SparklineSchema,
    pm10: SparklineSchema,
    co2:  SparklineSchema,
    voc:  SparklineSchema,
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
    pm03: z.array(z.number()),
    pm1:  z.array(z.number()),
    pm25: z.array(z.number()),
    pm10: z.array(z.number()),
  }).openapi({ description: 'Time-ordered reading arrays per PM channel' }),
}).openapi('AirQualityReadings');

const ReadingsResponseSchema = z.object({
  data: ReadingsSchema,
}).openapi('AirQualityReadingsResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function aqiCategory(aqi: number) {
  if (aqi <= 50)  return { name: 'Good',       color: '#82DBA6', container: 'var(--md-good-container)',      on: 'var(--md-on-good-container)' };
  if (aqi <= 100) return { name: 'Moderate',   color: '#FFD68A', container: 'var(--md-warn-container)',      on: 'var(--md-on-warn-container)' };
  if (aqi <= 150) return { name: 'Unhealthy*', color: '#FFB59A', container: 'var(--md-tertiary-container)',  on: 'var(--md-on-tertiary-container)' };
  if (aqi <= 200) return { name: 'Unhealthy',  color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
  return               { name: 'Hazardous',    color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
}

function getAirQualityMock() {
  const aqi = Math.round(jitter(42, 8));
  return {
    data: {
      aqi,
      category: aqiCategory(aqi),
      pm25:     jitter(8.2, 1.5),
      pm10:     jitter(14.6, 2.5),
      co2:      Math.round(jitter(612, 30)),
      voc:      jitter(0.42, 0.08),
      message:  'Air feels fresh — keep windows open until 14:00',
      sparklines: {
        pm25: makeSeries(28, 8.2,  3,  9),
        pm10: makeSeries(28, 14.6, 5,  15),
        co2:  makeSeries(28, 612,  80, 27),
        voc:  makeSeries(28, 0.42, 0.15, 31),
      },
    },
  };
}

function getReadingsMock() {
  return {
    data: {
      window:     '12h',
      resolution: '15min',
      count:      48,
      series: {
        pm03: makeSeries(48, 42, 16, Math.floor(Math.random() * 100)),
        pm1:  makeSeries(48, 18, 8,  Math.floor(Math.random() * 100)),
        pm25: makeSeries(48, 9,  4,  Math.floor(Math.random() * 100)),
        pm10: makeSeries(48, 16, 6,  Math.floor(Math.random() * 100)),
      },
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getAirQualityRoute = createRoute({
  method:      'get',
  path:        '/v1/air-quality',
  tags:        ['Air Quality'],
  summary:     'Get current air quality readings',
  description: 'Returns current AQI, particulate matter, CO₂, and VOC levels with 28-point sparkline history.',
  responses: {
    200: {
      content:     { 'application/json': { schema: AirQualityResponseSchema } },
      description: 'Current air quality data',
    },
  },
});

const getReadingsRoute = createRoute({
  method:      'get',
  path:        '/v1/air-quality/readings',
  tags:        ['Air Quality'],
  summary:     'Get historical PM readings',
  description: 'Returns 48-point time-series data for PM0.3, PM1, PM2.5, PM10 channels over the last 12 hours.',
  responses: {
    200: {
      content:     { 'application/json': { schema: ReadingsResponseSchema } },
      description: '48-point PM channel history',
    },
  },
});

export function registerAirQualityRoutes(app: OpenAPIHono) {
  app.openapi(getAirQualityRoute, (c) => c.json(getAirQualityMock()));
  app.openapi(getReadingsRoute,   (c) => c.json(getReadingsMock()));
}
