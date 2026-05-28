import { apiGet } from './client.js';

export const fetchDevices = () => apiGet('/v1/devices');
