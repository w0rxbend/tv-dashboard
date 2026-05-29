import { apiGet } from './client.js';

export const fetchEnergy = (opts) => apiGet('/v1/energy', opts);
