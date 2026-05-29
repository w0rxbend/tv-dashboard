import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { config } from '../config.js';
import { localNow } from '../lib/time.js';
import { commonErrorResponses } from '../lib/api-error.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const EventSchema = z.object({
  id:     z.string().openapi({ example: 'evt-001' }),
  time:   z.string().openapi({ example: '09:30', description: 'HH:MM format' }),
  ampm:   z.string().openapi({ example: 'AM' }),
  title:  z.string().openapi({ example: 'Design Review · Aurora' }),
  sub:    z.string().openapi({ example: 'Studio · with Mira & Theo' }),
  active: z.boolean().openapi({ example: true, description: 'Whether this event is currently in progress' }),
}).openapi('Event');

const EventsResponseSchema = z.object({
  data: z.object({
    date:   z.string().openapi({ example: '2026-05-28', description: 'ISO 8601 date' }),
    events: z.array(EventSchema),
  }),
}).openapi('EventsResponse');

const IsoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Expected a valid ISO calendar date');

const EventsQuerySchema = z.object({
  date: IsoDateSchema.optional().openapi({
    example: '2026-05-28',
    description: 'Filter by date (ISO 8601). Defaults to today.',
    param: { in: 'query', name: 'date' },
  }),
});

// ─── Mock data provider ──────────────────────────────────────────────────────

function getEventsMock(date: string) {
  const { totalMinutes: h } = localNow(config.location.timezone);

  const events = [
    { id: 'evt-001', time: '09:30', ampm: 'AM', title: 'Design Review · Aurora',   sub: 'Studio · with Mira & Theo',    active: h >= 570  && h < 630  },
    { id: 'evt-002', time: '11:00', ampm: 'AM', title: 'AirGradient firmware OTA', sub: 'Pi mesh · 4 sensors queued',   active: h >= 660  && h < 720  },
    { id: 'evt-003', time: '01:15', ampm: 'PM', title: 'Lunch · Linnea',           sub: 'Spritzhaus · table for two',   active: h >= 795  && h < 855  },
    { id: 'evt-004', time: '03:00', ampm: 'PM', title: 'Pickup · Noa',             sub: 'Vasaparken · soccer practice', active: h >= 900  && h < 960  },
    { id: 'evt-005', time: '07:30', ampm: 'PM', title: 'Movie night',              sub: 'Living room · queue ready',    active: h >= 1170 && h < 1290 }, // 2-hour window (19:30–21:30)
  ];

  return { data: { date, events } };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getEventsRoute = createRoute({
  method:      'get',
  path:        '/v1/events',
  tags:        ['Events'],
  summary:     'List events for a date',
  description: 'Returns the scheduled events for the given date (defaults to today). The `active` flag is true when the event is currently in progress.',
  request:     { query: EventsQuerySchema },
  responses: {
    200: {
      content:     { 'application/json': { schema: EventsResponseSchema } },
      description: "Today's event list",
    },
    ...commonErrorResponses,
  },
});

export function registerEventsRoutes(app: OpenAPIHono) {
  app.openapi(getEventsRoute, (c) => {
    const { date } = c.req.valid('query');
    const target = date ?? localNow(config.location.timezone).date;
    return c.json(getEventsMock(target), 200);
  });
}
