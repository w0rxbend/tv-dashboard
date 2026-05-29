import { createPolledResource } from './createPolledResource.js';

export function createPolling(fetcher, options) {
  return createPolledResource(fetcher, options);
}

export { createPolledResource };
