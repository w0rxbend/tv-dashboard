import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ReminderSchema = z.object({
  id:   z.string().openapi({ example: 'rem-001' }),
  text: z.string().openapi({ example: 'Replace HEPA filter — bedroom' }),
  when: z.string().openapi({ example: 'Today', description: 'Human-readable due label' }),
  done: z.boolean().openapi({ example: false }),
}).openapi('Reminder');

const RemindersResponseSchema = z.object({
  data: z.object({
    reminders: z.array(ReminderSchema),
  }),
}).openapi('RemindersResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getRemindersMock() {
  return {
    data: {
      reminders: [
        { id: 'rem-001', text: 'Replace HEPA filter — bedroom',       when: 'Today', done: false },
        { id: 'rem-002', text: 'Reorder ground coffee · Drop Coffee', when: 'Tue',   done: false },
        { id: 'rem-003', text: 'Renew sensor calibration',            when: 'Thu',   done: false },
        { id: 'rem-004', text: 'Water the monstera',                  when: 'Done',  done: true  },
      ],
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getRemindersRoute = createRoute({
  method:      'get',
  path:        '/v1/reminders',
  tags:        ['Reminders'],
  summary:     'List reminders',
  description: 'Returns all upcoming and recently completed reminders.',
  responses: {
    200: {
      content:     { 'application/json': { schema: RemindersResponseSchema } },
      description: 'Reminder list',
    },
  },
});

export function registerRemindersRoutes(app: OpenAPIHono) {
  app.openapi(getRemindersRoute, (c) => c.json(getRemindersMock()));
}
