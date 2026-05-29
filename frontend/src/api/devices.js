import { apiGet } from './client.js';

export const fetchDevices = (opts) => apiGet('/v1/devices', opts);
