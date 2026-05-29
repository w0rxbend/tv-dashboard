import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSystemStatusModel } from './systemStatusViewModel.js';

const ok = (latest = {}) => ({ latest });
const checking = () => ({});
const down = (message = 'Nope') => ({ error: { code: 'upstream_error', message } });
const degraded = () => ({ latest: {}, error: { code: 'timeout', message: 'Timed out' } });

test('createSystemStatusModel groups dashboard resources by external service', () => {
  const model = createSystemStatusModel({
    airQuality: ok(),
    airQualityReadings: degraded(),
    indoorClimate: ok(),
    weather: ok(),
    daylight: ok(),
    location: ok(),
    events: down('Calendar missing'),
    reminders: checking(),
    insights: ok(),
  });

  assert.equal(model.services.length, 5);
  assert.equal(model.services.find((service) => service.key === 'airgradient').status, 'degraded');
  assert.equal(model.services.find((service) => service.key === 'calendar').message, 'Calendar missing');
  assert.equal(model.counts.down, 1);
  assert.equal(model.counts.checking, 1);
  assert.equal(model.summary, '1 feed unavailable');
});

test('createSystemStatusModel prefers explicit backend status reports', () => {
  const model = createSystemStatusModel({
    systemStatus: {
      latest: {
        status: 'down',
        services: [
          { key: 'weather', label: 'Weather', status: 'operational', message: 'Open-Meteo reachable' },
          { key: 'airgradient', label: 'AirGradient', status: 'down', message: 'Connection refused' },
          { key: 'calendar', label: 'Calendar', status: 'not_configured', message: 'Google Calendar is not configured' },
        ],
      },
    },
    weather: {},
  });

  assert.equal(model.services.find((service) => service.key === 'weather').status, 'ok');
  assert.equal(model.services.find((service) => service.key === 'airgradient').status, 'down');
  assert.equal(model.services.find((service) => service.key === 'calendar').message, 'Google Calendar is not configured');
  assert.equal(model.counts.down, 2);
  assert.equal(model.summary, '2 feeds unavailable');
});

test('createSystemStatusModel maps the backend dependency status response', () => {
  const model = createSystemStatusModel({
    systemStatus: {
      latest: {
        status: 'down',
        checked_at: '2026-05-29T15:29:16.165Z',
        services: [
          {
            key: 'airgradient',
            label: 'AirGradient',
            status: 'down',
            message: 'AirGradient is unreachable',
            checked_at: '2026-05-29T15:29:16.165Z',
            details: { code: 'airgradient_upstream_error' },
          },
          {
            key: 'weather',
            label: 'Weather',
            status: 'operational',
            message: 'Open-Meteo reachable',
            checked_at: '2026-05-29T15:29:16.165Z',
          },
          {
            key: 'calendar',
            label: 'Calendar',
            status: 'not_configured',
            message: 'Google Calendar is not configured',
            checked_at: '2026-05-29T15:29:16.165Z',
            details: { code: 'calendar_not_configured' },
          },
          {
            key: 'reminders',
            label: 'Reminders',
            status: 'operational',
            message: 'Local reminders available',
            checked_at: '2026-05-29T15:29:16.165Z',
          },
          {
            key: 'insights',
            label: 'Insights',
            status: 'operational',
            message: 'Local insights available',
            checked_at: '2026-05-29T15:29:16.165Z',
          },
        ],
      },
    },
  });

  assert.equal(model.summary, '2 feeds unavailable');
  assert.equal(model.counts.live, 3);
  assert.equal(model.counts.total, 5);
  assert.equal(model.services.find((service) => service.key === 'weather').status, 'ok');
  assert.equal(model.services.find((service) => service.key === 'calendar').message, 'Google Calendar is not configured');
});

test('createSystemStatusModel shows a single status API loading row while backend status is pending', () => {
  const model = createSystemStatusModel({
    systemStatus: {},
    airQuality: {},
    weather: {},
  });

  assert.equal(model.services.length, 1);
  assert.equal(model.services[0].key, 'status-api');
  assert.equal(model.services[0].status, 'checking');
  assert.equal(model.summary, 'Checking status API');
});
