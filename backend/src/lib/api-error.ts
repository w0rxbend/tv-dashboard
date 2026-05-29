import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().openapi({ example: 'upstream_error' }),
    message: z.string().openapi({ example: 'Upstream service is unavailable' }),
    details: z.array(z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
}).openapi('ErrorResponse');

export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;
  readonly details: unknown[];

  constructor(
    status: ContentfulStatusCode,
    code: string,
    message: string,
    details: unknown[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class UpstreamError extends AppError {
  constructor(
    message: string,
    status: ContentfulStatusCode = 503,
    code = 'upstream_error',
    details: unknown[] = [],
  ) {
    super(status, code, message, details);
    this.name = 'UpstreamError';
  }
}

export const errorResponse = (description: string) => ({
  content: { 'application/json': { schema: ErrorResponseSchema } },
  description,
});

export const commonErrorResponses = {
  400: errorResponse('Request validation failed'),
  500: errorResponse('Internal server error'),
};

export const upstreamErrorResponses = {
  502: errorResponse('Upstream service returned an invalid or rejected response'),
  503: errorResponse('Upstream service unavailable'),
  504: errorResponse('Upstream service timed out'),
  ...commonErrorResponses,
};

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(500, 'internal_error', err.message);
  return new AppError(500, 'internal_error', 'Internal server error');
}

export function toErrorBody(err: AppError, requestId?: string) {
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(err.details.length ? { details: err.details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  };
}

export function jsonError(c: Context, err: unknown) {
  const appError = toAppError(err);
  return c.json(toErrorBody(appError), appError.status);
}

export function validationErrorDetails(err: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return err.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
