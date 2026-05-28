import { apiGet } from './client.js';

export const fetchIndoorClimate = () => apiGet('/v1/indoor-climate');
