import { apiGet } from './client.js';

export const fetchLocation = () => apiGet('/v1/location');
