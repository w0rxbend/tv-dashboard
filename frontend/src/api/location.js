import { apiGet } from './client.js';

export const fetchLocation = (opts) => apiGet('/v1/location', opts);
