import { makeSeries } from '../lib/mock.js';
import type { OpenMeteoAirQualityResponse } from './open-meteo.js';

function aqiCategory(aqi: number) {
  if (aqi <= 50)  return { name: 'Good',       color: '#82DBA6', container: 'var(--md-good-container)',      on: 'var(--md-on-good-container)' };
  if (aqi <= 100) return { name: 'Moderate',   color: '#FFD68A', container: 'var(--md-warn-container)',      on: 'var(--md-on-warn-container)' };
  if (aqi <= 150) return { name: 'Unhealthy*', color: '#FFB59A', container: 'var(--md-tertiary-container)',  on: 'var(--md-on-tertiary-container)' };
  if (aqi <= 200) return { name: 'Unhealthy',  color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
  return               { name: 'Hazardous',    color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
}

function aqiMessage(aqi: number): string {
  if (aqi <= 50)  return 'Air quality is Good — safe for all activities';
  if (aqi <= 100) return 'Air quality is Moderate — sensitive groups take care';
  if (aqi <= 150) return 'Unhealthy for sensitive groups — limit prolonged outdoor exertion';
  if (aqi <= 200) return 'Unhealthy — reduce outdoor activities';
  return                 'Hazardous — avoid all outdoor activities';
}

export function mapAirQualityView(raw: OpenMeteoAirQualityResponse) {
  const aqi = raw.current.us_aqi;
  const pm25 = +raw.current.pm2_5.toFixed(1);
  const pm10 = +raw.current.pm10.toFixed(1);
  const category = aqiCategory(aqi);

  return {
    aqi,
    category,
    pm25,
    pm10,
    co2:     612,   // indoor sensor — mock until real hardware integration
    voc:     0.42,  // indoor sensor — mock until real hardware integration
    message: aqiMessage(aqi),
    sparklines: {
      pm25: makeSeries(28, pm25,  3,  9),
      pm10: makeSeries(28, pm10,  5,  15),
      co2:  makeSeries(28, 612,   80, 27),
      voc:  makeSeries(28, 0.42, 0.15, 31),
    },
  };
}
