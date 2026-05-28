/**
 * Builds a 503 JSON response for upstream API failures.
 *
 * Returns `any` because Hono's RouteHandler types require the schema-typed
 * response shape, but plain `Response` objects are accepted at runtime.
 * Using `any` is the narrowest escape that keeps the cast out of every handler.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function upstreamError(message: string): any {
  return new Response(
    JSON.stringify({ error: { code: 'upstream_error', message } }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );
}
