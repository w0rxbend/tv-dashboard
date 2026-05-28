export { fetchLocation }                             from './location.js';
export { fetchWeather }                              from './weather.js';
export { fetchAirQuality, fetchAirQualityReadings }  from './air-quality.js';
export { fetchIndoorClimate }                        from './indoor-climate.js';
export { fetchEvents }                               from './events.js';
export { fetchReminders }                            from './reminders.js';
export { fetchDaylight }                             from './daylight.js';
export { fetchInsights }                             from './insights.js';
export { fetchDevices }                              from './devices.js';
export { fetchEnergy }                               from './energy.js';
export { ApiError }                                  from './client.js';

/**
 * Recommended polling intervals (milliseconds) per domain.
 *
 * Chosen to balance data freshness vs. request volume:
 *  - Sensor telemetry: aggressive (10 s) — values change rapidly
 *  - Climate / devices: moderate (1 min) — slow-moving
 *  - Calendar data: lazy (10 min) — rarely changes mid-session
 *  - Daylight: once per day — sun times don't change intra-day
 */
export const POLL = Object.freeze({
  AIR_QUALITY:    10_000,      // 10 s
  ENERGY:         30_000,      // 30 s
  INDOOR_CLIMATE: 60_000,      // 1 min
  DEVICES:        60_000,      // 1 min
  INSIGHTS:       300_000,     // 5 min
  WEATHER:        600_000,     // 10 min
  EVENTS:         600_000,     // 10 min
  REMINDERS:      600_000,     // 10 min
  DAYLIGHT:       86_400_000,  // 24 h
});
