import { apiGet } from './client.js';

export const fetchEnergy = () => apiGet('/v1/energy');
