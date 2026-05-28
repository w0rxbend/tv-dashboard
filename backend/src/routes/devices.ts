import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter } from '../lib/mock.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const DeviceSchema = z.object({
  id:       z.string().openapi({ example: 'dev-001' }),
  name:     z.string().openapi({ example: 'Living Room Sensor' }),
  type:     z.string().openapi({ example: 'air_quality', description: 'Sensor type identifier' }),
  online:   z.boolean().openapi({ example: true }),
  latency_ms: z.number().openapi({ example: 38, description: 'Last round-trip latency in milliseconds' }),
}).openapi('Device');

const DeviceMeshSchema = z.object({
  total:     z.number().openapi({ example: 4 }),
  online:    z.number().openapi({ example: 4 }),
  latency_ms: z.number().openapi({ example: 142, description: 'Average mesh latency' }),
  devices:   z.array(DeviceSchema),
}).openapi('DeviceMesh');

const DevicesResponseSchema = z.object({
  data: DeviceMeshSchema,
}).openapi('DevicesResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getDevicesMock() {
  const devices = [
    { id: 'dev-001', name: 'Living Room Sensor', type: 'air_quality', online: true,  latency_ms: Math.round(jitter(38,  8)) },
    { id: 'dev-002', name: 'Bedroom Sensor',     type: 'air_quality', online: true,  latency_ms: Math.round(jitter(42,  10)) },
    { id: 'dev-003', name: 'Kitchen Sensor',     type: 'air_quality', online: true,  latency_ms: Math.round(jitter(55,  12)) },
    { id: 'dev-004', name: 'Outdoor Station',    type: 'weather',     online: true,  latency_ms: Math.round(jitter(180, 30)) },
  ];
  const online = devices.filter(d => d.online).length;
  const avgLatency = Math.round(devices.reduce((s, d) => s + d.latency_ms, 0) / devices.length);
  return { data: { total: devices.length, online, latency_ms: avgLatency, devices } };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getDevicesRoute = createRoute({
  method:      'get',
  path:        '/v1/devices',
  tags:        ['Devices'],
  summary:     'Get device mesh status',
  description: 'Returns the status and latency of all sensors in the local mesh network.',
  responses: {
    200: {
      content:     { 'application/json': { schema: DevicesResponseSchema } },
      description: 'Device mesh status',
    },
  },
});

export function registerDevicesRoutes(app: OpenAPIHono) {
  app.openapi(getDevicesRoute, (c) => c.json(getDevicesMock()));
}
