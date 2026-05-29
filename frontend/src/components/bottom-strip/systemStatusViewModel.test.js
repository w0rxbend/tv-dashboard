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
