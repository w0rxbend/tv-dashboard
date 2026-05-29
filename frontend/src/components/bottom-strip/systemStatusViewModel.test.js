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
