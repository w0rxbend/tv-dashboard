import { serve } from '@hono/node-server';
import app from './app.js';
import { config } from './config.js';

serve({ fetch: app.fetch, port: config.server.port }, (info) => {
  console.log(`Aurora API  →  http://localhost:${info.port}/api/health`);
  console.log(`Swagger UI  →  http://localhost:${info.port}/api/docs`);
  console.log(`OpenAPI     →  http://localhost:${info.port}/api/openapi.json`);
});
