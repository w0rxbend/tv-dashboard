import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UpstreamError } from '../lib/api-error.js';
import { fetchWeatherFromAPI } from './open-meteo.js';

const weatherPayload = {
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

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

test('fetchWeatherFromAPI validates upstream response shape', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => jsonResponse({ current: {} });

  await assert.rejects(
    fetchWeatherFromAPI(10.001, 20.001),
    (err) => err instanceof UpstreamError && err.code === 'upstream_bad_response',
  );
});

test('fetchWeatherFromAPI uses stale cache when refresh fails', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  t.after(() => {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
  });

  let now = 1_000;
  let calls = 0;
  Date.now = () => now;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? jsonResponse(weatherPayload)
      : jsonResponse({ error: 'unavailable' }, { status: 503, statusText: 'Service Unavailable' });
  };

  const first = await fetchWeatherFromAPI(10.002, 20.002);
  now += 15 * 60 * 1_000 + 1;
  const second = await fetchWeatherFromAPI(10.002, 20.002);

  assert.equal(calls, 3);
  assert.deepEqual(second, first);
});

test('fetchWeatherFromAPI classifies aborts as upstream timeouts', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    throw err;
  };

  await assert.rejects(
    fetchWeatherFromAPI(10.003, 20.003),
    (err) => err instanceof UpstreamError && err.code === 'upstream_timeout' && err.status === 504,
  );
});
