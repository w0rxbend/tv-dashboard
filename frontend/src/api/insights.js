import { apiGet } from './client.js';

export const fetchInsights = () => apiGet('/v1/insights');
