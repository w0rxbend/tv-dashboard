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
 * @param {(opts?: { signal?: AbortSignal }) => Promise<T>} fetcher  Async function.
 * @param {{ interval: number }} options
 * @returns {import('solid-js').Resource<T>}
 *
 * @example
 * const weather = createPolling(fetchWeather, { interval: POLL.WEATHER });
 * // In JSX:
 * <span>{weather.latest?.current?.temperature ?? '—'}</span>
 */
export function createPolling(fetcher, { interval }) {
  let controller = null;

  const [resource, { refetch }] = createResource(async () => {
    controller = new AbortController();
    const signal = controller.signal;

    try {
      return await fetcher({ signal });
    } finally {
      if (controller?.signal === signal) controller = null;
    }
  });

  const refetchIfIdle = () => {
    if (!resource.loading) refetch();
  };

  const id = setInterval(refetchIfIdle, interval);
  onCleanup(() => {
    clearInterval(id);
    controller?.abort();
  });

  return resource;
}
