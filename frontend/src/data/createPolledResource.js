import { createResource, onCleanup } from 'solid-js';

/**
 * Fetches once immediately, then refetches on an interval without overlapping
 * requests. The previous successful value remains available as `resource.latest`
 * while a background refresh is loading.
 *
 * Must be called inside a Solid owner, such as a component function.
 *
 * @template T
 * @param {(opts?: { signal?: AbortSignal }) => Promise<T>} fetcher
 * @param {{ interval: number }} options
 * @returns {import('solid-js').Resource<T>}
 */
export function createPolledResource(fetcher, { interval }) {
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

  const intervalId = setInterval(refetchIfIdle, interval);
  onCleanup(() => {
    clearInterval(intervalId);
    controller?.abort();
  });

  return resource;
}
