import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { config } from '../config.js';
import { localNow } from '../lib/time.js';
import { upstreamError } from '../lib/upstream-error.js';
import { upstreamErrorResponses } from '../lib/api-error.js';
import { googleCalendar } from '../services/google-calendar.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const EventSchema = z.object({
  id:     z.string().openapi({ example: 'evt-001' }),
  time:   z.string().openapi({ example: '09:30', description: 'HH:MM format, or ALL for all-day events' }),
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

// ─── Routes ──────────────────────────────────────────────────────────────────

const getEventsRoute = createRoute({
  method:      'get',
  path:        '/v1/events',
  tags:        ['Events'],
  summary:     'List events for a date',
  description: [
    'Returns Google Calendar events for the given date (defaults to today).',
    '',
    'Set Google Calendar credentials in the backend environment to enable this endpoint.',
  ].join('\n'),
  request:     { query: EventsQuerySchema },
  responses: {
    200: {
      content:     { 'application/json': { schema: EventsResponseSchema } },
      description: "Today's event list",
    },
    ...upstreamErrorResponses,
  },
});

export function registerEventsRoutes(app: OpenAPIHono) {
  app.openapi(getEventsRoute, async (c) => {
    const { date } = c.req.valid('query');
    const target = date ?? localNow(config.location.timezone).date;

    try {
      const events = await googleCalendar.listEventsForDate(target, config.location.timezone);
      return c.json({ data: { date: target, events } }, 200);
    } catch (err) {
      return upstreamError(err);
    }
  });
}
