import { apiGet } from './client.js';

export const fetchInsights = (opts) => apiGet('/v1/insights', opts);
