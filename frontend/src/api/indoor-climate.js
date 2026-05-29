import { apiGet } from './client.js';

export const fetchIndoorClimate = (opts) => apiGet('/v1/indoor-climate', opts);
