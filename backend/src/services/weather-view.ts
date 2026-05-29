import { hhmm, hhmmToMinutes } from '../lib/time.js';
import {
  degreesToCardinal,
  type OpenMeteoWeatherResponse,
  uvMeta,
  wmoToCondition,
} from './open-meteo.js';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export interface WeatherLocationView {
  city: string;
  region: string;
}

export function mapWeatherView(raw: OpenMeteoWeatherResponse, location: WeatherLocationView) {
  const cur = raw.current;
  const daily = raw.daily;
  const uvIndex = Math.round(cur.uv_index);
  const cond = wmoToCondition(cur.weather_code);

  return {
    current: {
      temperature:     cur.temperature_2m,
      feels_like:      cur.apparent_temperature,
      condition:       cond.condition,
      condition_label: cond.condition_label,
      icon:            cond.icon,
      weather_icon:    cond.weather_icon,
      wind_speed:      cur.wind_speed_10m,
      wind_direction:  degreesToCardinal(cur.wind_direction_10m),
      humidity:        cur.relative_humidity_2m,
      uv_index:        uvIndex,
      ...uvMeta(uvIndex),
      location,
    },
    forecast: daily.time.map((dateStr, i) => {
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      const fc = wmoToCondition(daily.weather_code[i]);

      return {
        day:          DAY_LABELS[dayOfWeek],
        icon:         fc.icon,
        weather_icon: fc.weather_icon,
        high:         Math.round(daily.temperature_2m_max[i]),
        low:          Math.round(daily.temperature_2m_min[i]),
      };
    }),
  };
}

export function mapDaylightView(
  raw: OpenMeteoWeatherResponse,
  now: { date: string; totalMinutes: number },
) {
  const sunrise = hhmm(raw.daily.sunrise[0]);
  const sunset = hhmm(raw.daily.sunset[0]);

  const sunriseMin = hhmmToMinutes(sunrise);
  const sunsetMin = hhmmToMinutes(sunset);
  const dayLen = sunsetMin - sunriseMin;
  const elapsed = Math.min(1, Math.max(0, (now.totalMinutes - sunriseMin) / dayLen));

  return {
    date: now.date,
    sunrise,
    sunset,
    progress:         +elapsed.toFixed(4),
    day_length_hours: +(dayLen / 60).toFixed(2),
  };
}
