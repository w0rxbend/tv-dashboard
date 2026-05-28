import { createResource, onCleanup } from 'solid-js';

/**
 * SolidJS primitive: fetches `fetcher()` immediately and re-fetches every
 * `interval` ms.  Returns the resource accessor — use `resource.latest` in
 * templates so the previous value stays visible during background refreshes
 * (no flash-of-empty-content on every poll).
 *
 * Must be called inside a reactive owner (component function or runWithOwner).
 *
 * @template T
 * @param {() => Promise<T>} fetcher  Zero-argument async function.
 * @param {{ interval: number }} options
 * @returns {import('solid-js').Resource<T>}
 *
 * @example
 * const weather = createPolling(fetchWeather, { interval: POLL.WEATHER });
 * // In JSX:
 * <span>{weather.latest?.current?.temperature ?? '—'}</span>
 */
export function createPolling(fetcher, { interval }) {
  const [resource, { refetch }] = createResource(fetcher);

  const id = setInterval(() => { refetch(); }, interval);
  onCleanup(() => clearInterval(id));

  return resource;
}
