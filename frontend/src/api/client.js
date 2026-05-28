/**
 * Base HTTP client for the Aurora BFF API.
 *
 * All domain modules call `apiGet(path)` which:
 *   - resolves relative to /api (proxied by Vite in dev, served directly in prod)
 *   - unwraps the standard `{ data }` envelope
 *   - throws `ApiError` on non-2xx or network failure
 *
 * To swap from mock to production: update the backend — client code stays identical.
 */

const BASE = import.meta.env.VITE_API_BASE ?? '/api';
const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  /** @param {number} status  @param {string} code  @param {string} message  @param {unknown[]=} details */
  constructor(status, code, message, details) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.code   = code;
    this.details = details ?? [];
  }
}

/**
 * GET `${BASE}${path}`, parse JSON, unwrap `{ data }`.
 * @param {string} path
 * @param {{ timeout?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown>}
 */
export async function apiGet(path, opts = {}) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), opts.timeout ?? DEFAULT_TIMEOUT_MS);

  // Allow callers to supply their own abort signal alongside the timeout
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method:  'GET',
      headers: { Accept: 'application/json' },
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = body?.error ?? {};
      throw new ApiError(res.status, err.code ?? 'http_error', err.message ?? `HTTP ${res.status}`, err.details);
    }

    return body.data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') throw new ApiError(0, 'timeout', 'Request timed out');
    throw new ApiError(0, 'network_error', err?.message ?? 'Network error');
  }
}
