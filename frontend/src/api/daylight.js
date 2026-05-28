import { apiGet } from './client.js';

export const fetchDaylight = () => apiGet('/v1/daylight');
