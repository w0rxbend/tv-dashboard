import { UpstreamError, toAppError, toErrorBody } from './api-error.js';

/**
 * Builds a JSON response for upstream API failures.
 *
 * Returns `any` so route handlers can preserve their generated response
 * types without repeating a local cast at every catch site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function upstreamError(err: unknown): any {
  const appError = err instanceof Error
    ? toAppError(err)
    : new UpstreamError('Unknown upstream error');

  return new Response(
    JSON.stringify(toErrorBody(appError)),
    { status: appError.status, headers: { 'Content-Type': 'application/json' } },
  );
}
