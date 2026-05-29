import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapAirQualityReadings, mapAirQualityView } from './air-quality-view.js';
import type { AirGradientCurrent, AirGradientRange } from './airgradient.js';

const current: AirGradientCurrent = {
  timestamp: 1,
  metrics: [
    { key: 'pm25', label: 'PM2.5', unit: 'ug/m3', value: 8.6, timestamp: 1, min: 0, max: 75, status: 'good' },
    { key: 'co2', label: 'CO2', unit: 'ppm', value: 612, timestamp: 1, min: 400, max: 3000, status: 'good' },
    { key: 'voc', label: 'TVOC', unit: 'index', value: 121, timestamp: 1, min: 0, max: 500, status: 'warning' },
    { key: 'nox', label: 'NOx', unit: 'index', value: 1, timestamp: 1, min: 0, max: 500, status: 'good' },
    { key: 'temperature', label: 'Temperature', unit: 'C', value: 24.2, timestamp: 1, min: 10, max: 35, status: 'good' },
    { key: 'humidity', label: 'Humidity', unit: '%', value: 59, timestamp: 1, min: 0, max: 100, status: 'good' },
  ],
};

function range(metric: string, values: number[]): AirGradientRange {
  return {
    metric,
    label: metric,
    unit: '',
    range: '12h',
    step: '15m',
    points: values.map((value, index) => [index, value]),
  };
}

test('mapAirQualityView uses AirGradient current and trend values', () => {
  const view = mapAirQualityView(current, {
    pm25: range('pm25', [8, 9]),
    co2:  range('co2', [600, 612]),
    voc:  range('voc', [100, 121]),
    nox:  range('nox', [1, 2]),
  });

  assert.equal(view.pm25, 8.6);
  assert.equal(view.co2, 612);
  assert.equal(view.voc, 121);
  assert.equal(view.nox, 1);
  assert.deepEqual(view.sparklines.nox, [1, 2]);
});

test('mapAirQualityReadings maps AirGradient ranges into chart series', () => {
  const readings = mapAirQualityReadings([
    range('pm25', [8, 9]),
    range('co2', [600, 612]),
    range('voc', [100, 121]),
    range('nox', [1, 2]),
  ]);

  assert.equal(readings.window, '12h');
  assert.equal(readings.resolution, '15m');
  assert.equal(readings.count, 2);
  assert.deepEqual(readings.series.pm25, [8, 9]);
  assert.deepEqual(readings.series.co2, [600, 612]);
  assert.deepEqual(readings.series.voc, [100, 121]);
  assert.deepEqual(readings.series.nox, [1, 2]);
});
