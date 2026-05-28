import { apiGet } from './client.js';

/** @returns {Promise<import('./types').WeatherData>} */
export const fetchWeather = () => apiGet('/v1/weather');
