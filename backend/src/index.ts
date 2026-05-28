import { serve } from '@hono/node-server';
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Aurora API  →  http://localhost:${info.port}/api/health`);
  console.log(`Swagger UI  →  http://localhost:${info.port}/api/docs`);
  console.log(`OpenAPI     →  http://localhost:${info.port}/api/openapi.json`);
});
