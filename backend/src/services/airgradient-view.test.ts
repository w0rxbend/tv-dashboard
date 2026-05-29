import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapAirGradientSnapshot, pm25ToUsAqi, rangeValues } from './airgradient-view.js';
import type { AirGradientCurrent, AirGradientRange } from './airgradient.js';

const current: AirGradientCurrent = {
  timestamp: 1_764_284_400_000,
  metrics: [
    { key: 'pm25', label: 'PM2.5', unit: 'ug/m3', value: 8.6, timestamp: 1, min: 0, max: 75, status: 'good' },
    { key: 'co2', label: 'CO2', unit: 'ppm', value: 612, timestamp: 1, min: 400, max: 3000, status: 'good' },
    { key: 'voc', label: 'TVOC', unit: 'index', value: 121.4, timestamp: 1, min: 0, max: 500, status: 'warning' },
    { key: 'nox', label: 'NOx', unit: 'index', value: 1.2, timestamp: 1, min: 0, max: 500, status: 'good' },
    { key: 'temperature', label: 'Temperature', unit: 'C', value: 24.26, timestamp: 1, min: 10, max: 35, status: 'good' },
    { key: 'humidity', label: 'Humidity', unit: '%', value: 59.66, timestamp: 1, min: 0, max: 100, status: 'good' },
  ],
};

test('mapAirGradientSnapshot normalizes current metrics', () => {
  assert.deepEqual(mapAirGradientSnapshot(current), {
    pm25: 8.6,
    co2: 612,
    voc: 121,
    nox: 1,
    temperature: 24.3,
    humidity: 59.7,
  });
});

test('pm25ToUsAqi maps PM2.5 concentration to EPA AQI', () => {
  assert.equal(pm25ToUsAqi(8.6), 36);
  assert.equal(pm25ToUsAqi(25), 78);
});

test('rangeValues returns rounded values from AirGradient points', () => {
  const range: AirGradientRange = {
    metric: 'voc',
    label: 'TVOC',
    unit: 'index',
    range: '12h',
    step: '15m',
    points: [[1, 101.24], [2, 109.86]],
  };

  assert.deepEqual(rangeValues(range), [101.2, 109.9]);
});
