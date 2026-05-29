import { apiGet } from './client.js';

export const fetchStatus = (opts) => apiGet('/v1/status', opts);
