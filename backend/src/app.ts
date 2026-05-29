import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { AppError, jsonError, validationErrorDetails } from './lib/api-error.js';
import { config } from './config.js';

import { registerLocationRoutes }      from './routes/location.js';
import { registerWeatherRoutes }       from './routes/weather.js';
import { registerAirQualityRoutes }    from './routes/air-quality.js';
import { registerIndoorClimateRoutes } from './routes/indoor-climate.js';
import { registerEventsRoutes }        from './routes/events.js';
import { registerRemindersRoutes }     from './routes/reminders.js';
import { registerDaylightRoutes }      from './routes/daylight.js';
import { registerInsightsRoutes }      from './routes/insights.js';
import { registerDevicesRoutes }       from './routes/devices.js';
import { registerEnergyRoutes }        from './routes/energy.js';

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (result.success) return;

    return jsonError(
      c,
      new AppError(400, 'validation_error', 'Request validation failed', validationErrorDetails(result.error)),
    );
  },
}).basePath('/api');

app.onError((err, c) => jsonError(c, err));
app.notFound((c) => jsonError(c, new AppError(404, 'not_found', 'Route not found')));

// ─── CORS (allow local Vite dev server) ──────────────────────────────────────

app.use('*', cors({ origin: config.server.corsOrigins }));

// ─── Domain routes ───────────────────────────────────────────────────────────

registerLocationRoutes(app);
registerWeatherRoutes(app);
registerAirQualityRoutes(app);
registerIndoorClimateRoutes(app);
registerEventsRoutes(app);
registerRemindersRoutes(app);
registerDaylightRoutes(app);
registerInsightsRoutes(app);
registerDevicesRoutes(app);
registerEnergyRoutes(app);

// ─── Health check ────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// ─── OpenAPI spec + Swagger UI ───────────────────────────────────────────────

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title:       'Aurora Dashboard API',
    version:     '1.0.0',
    description: [
      'BFF API for the Aurora Material Ambient TV dashboard.',
      '',
      '## Polling recommendations',
      '| Domain | Endpoint | Interval |',
      '|--------|----------|----------|',
      '| Air quality (current) | `GET /api/v1/air-quality` | 10 s |',
      '| Environmental telemetry | `GET /api/v1/air-quality/readings` | 10 s |',
      '| Energy | `GET /api/v1/energy` | 30 s |',
      '| Indoor climate | `GET /api/v1/indoor-climate` | 1 min |',
      '| Devices | `GET /api/v1/devices` | 1 min |',
      '| Insights | `GET /api/v1/insights` | 5 min |',
      '| Weather | `GET /api/v1/weather` | 10 min |',
      '| Events | `GET /api/v1/events` | 10 min |',
      '| Reminders | `GET /api/v1/reminders` | 10 min |',
      '| Daylight | `GET /api/v1/daylight` | once/day |',
    ].join('\n'),
  },
  tags: [
    { name: 'Location',       description: 'Dashboard location configuration' },
    { name: 'Weather',        description: 'Outdoor conditions and forecast' },
    { name: 'Air Quality',    description: 'AQI, particulates, CO₂, VOC readings' },
    { name: 'Indoor Climate', description: 'Indoor temperature, humidity, CO₂, VOC' },
    { name: 'Events',         description: 'Calendar events and agenda' },
    { name: 'Reminders',      description: 'Personal reminders' },
    { name: 'Daylight',       description: 'Sunrise/sunset and solar progress' },
    { name: 'Insights',       description: 'AI-generated home environment insights' },
    { name: 'Devices',        description: 'Sensor mesh status' },
    { name: 'Energy',         description: 'Home energy consumption and solar generation' },
  ],
});

app.get('/docs', swaggerUI({ url: '/api/openapi.json' }));

export default app;
