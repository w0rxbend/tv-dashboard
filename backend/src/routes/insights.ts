import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const InsightSchema = z.object({
  id:    z.string().openapi({ example: 'ins-001' }),
  icon:  z.string().openapi({ example: 'auto_awesome', description: 'Material Symbols icon name' }),
  title: z.string().openapi({ example: 'Air quality has been Good for 14 days straight' }),
  sub:   z.string().openapi({ example: 'longest streak this year' }),
}).openapi('Insight');

const InsightsResponseSchema = z.object({
  data: z.object({
    insights: z.array(InsightSchema),
  }),
}).openapi('InsightsResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getInsightsMock() {
  return {
    data: {
      insights: [
        { id: 'ins-001', icon: 'auto_awesome', title: 'Air quality has been Good for 14 days straight',    sub: 'longest streak this year' },
        { id: 'ins-002', icon: 'eco',          title: 'Bedroom CO₂ dropped 22% after evening ventilation', sub: 'overnight average 480 ppm' },
        { id: 'ins-003', icon: 'cyclone',      title: 'Light north-east breeze through tomorrow morning',   sub: 'open windows safely' },
      ],
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getInsightsRoute = createRoute({
  method:      'get',
  path:        '/v1/insights',
  tags:        ['Insights'],
  summary:     'List AI-generated insights',
  description: 'Returns the current set of Aurora-generated home environment insights.',
  responses: {
    200: {
      content:     { 'application/json': { schema: InsightsResponseSchema } },
      description: 'Insight list',
    },
  },
});

export function registerInsightsRoutes(app: OpenAPIHono) {
  app.openapi(getInsightsRoute, (c) => c.json(getInsightsMock()));
}
