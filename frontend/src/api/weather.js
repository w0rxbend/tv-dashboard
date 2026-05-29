import { apiGet } from './client.js';

export const fetchWeather = (opts) => apiGet('/v1/weather', opts);
