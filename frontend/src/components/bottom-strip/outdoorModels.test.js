import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createUvIndexModel,
  createWindModel,
  normalizedDegrees,
  normalizedNumber,
  uvLevelFromIndex,
  windLevelFromSpeed,
} from './outdoorModels.js';

test('outdoor model helpers normalize invalid values safely', () => {
  assert.equal(normalizedNumber('12.4'), 12.4);
  assert.equal(normalizedNumber('nope'), null);
  assert.equal(normalizedDegrees(-20), 340);
  assert.equal(normalizedDegrees('bad'), null);
});

test('wind and UV levels map values to presentation bands', () => {
  assert.equal(windLevelFromSpeed(null), 'calm');
  assert.equal(windLevelFromSpeed(12), 'light');
  assert.equal(windLevelFromSpeed(28), 'breezy');
  assert.equal(windLevelFromSpeed(39), 'strong');

  assert.equal(uvLevelFromIndex(null), 'low');
  assert.equal(uvLevelFromIndex(5), 'moderate');
  assert.equal(uvLevelFromIndex(7), 'high');
  assert.equal(uvLevelFromIndex(10), 'very_high');
  assert.equal(uvLevelFromIndex(12), 'extreme');
});

test('wind and UV view models provide safe text for partial weather data', () => {
  assert.equal(createWindModel(undefined).ariaLabel, 'Outdoor wind loading');
  assert.equal(createUvIndexModel(undefined).ariaLabel, 'UV index loading');

  const wind = createWindModel({ wind_speed: 11.6, wind_gust: null, wind_direction: 'NE' });
  assert.equal(wind.speedText, 12);
  assert.equal(wind.gustText, '-');
  assert.equal(wind.ariaLabel, 'Outdoor wind 12 kilometers per hour from NE');

  const uv = createUvIndexModel({ uv_index: 6.4, uv_label: 'High' });
  assert.equal(uv.valueText, 6);
  assert.equal(uv.ariaLabel, 'UV index 6.4, High');
});
