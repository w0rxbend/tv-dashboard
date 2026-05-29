import { apiGet } from './client.js';

export const fetchDaylight = (opts) => apiGet('/v1/daylight', opts);
