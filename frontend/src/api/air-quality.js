import { apiGet } from './client.js';

/** Current AQI, PM2.5/CO2/TVOC/NOx + sparklines. */
export const fetchAirQuality = (opts) => apiGet('/v1/air-quality', opts);

/** Historical AirGradient series for the telemetry chart. */
export const fetchAirQualityReadings = (opts) => apiGet('/v1/air-quality/readings', opts);
