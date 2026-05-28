import { apiGet } from './client.js';

/** Current AQI, PM2.5/PM10/CO2/VOC + sparklines. */
export const fetchAirQuality = () => apiGet('/v1/air-quality');

/** 48-point historical PM series for the telemetry chart. */
export const fetchAirQualityReadings = () => apiGet('/v1/air-quality/readings');
