import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapDaylightView, mapWeatherView } from './weather-view.js';
import type { OpenMeteoWeatherResponse } from './open-meteo.js';

const raw: OpenMeteoWeatherResponse = {
  current: {
    temperature_2m: 18.4,
    relative_humidity_2m: 55,
    apparent_temperature: 17.8,
    weather_code: 2,
    wind_speed_10m: 11,
    wind_direction_10m: 45,
    wind_gusts_10m: 20,
    uv_index: 4.2,
  },
  daily: {
    time: ['2026-05-29'],
    weather_code: [2],
    temperature_2m_max: [22.4],
    temperature_2m_min: [12.2],
    sunrise: ['2026-05-29T04:55'],
    sunset: ['2026-05-29T20:55'],
    daylight_duration: [57_600],
    uv_index_max: [5.1],
  },
};

test('mapWeatherView exposes outdoor wind and UV values from Open-Meteo', () => {
  const weather = mapWeatherView(raw, { city: 'Kyiv', region: 'Kyiv · UA' });

  assert.equal(weather.current.wind_speed, 11);
  assert.equal(weather.current.wind_degrees, 45);
  assert.equal(weather.current.wind_direction, 'NE');
  assert.equal(weather.current.wind_gust, 20);
  assert.equal(weather.current.wind_level, 'light');
  assert.equal(weather.current.wind_label, 'Light');
  assert.equal(weather.current.uv_index, 4);
  assert.equal(weather.current.uv_max_today, 5);
  assert.equal(weather.current.uv_progress, 0.364);
  assert.equal(weather.current.uv_level, 'moderate');
  assert.equal(weather.current.uv_label, 'Moderate');
});

test('mapDaylightView uses Open-Meteo daylight duration', () => {
  const daylight = mapDaylightView(raw, { date: '2026-05-29', totalMinutes: 12 * 60 });

  assert.equal(daylight.sunrise, '04:55');
  assert.equal(daylight.sunset, '20:55');
  assert.equal(daylight.day_length_hours, 16);
});
