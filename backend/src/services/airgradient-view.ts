import type { AirGradientCurrent, AirGradientMetricKey, AirGradientRange } from './airgradient.js';
import { UpstreamError } from '../lib/api-error.js';

export interface AirGradientSnapshot {
  pm25: number;
  co2: number;
  voc: number;
  nox: number;
  temperature: number;
  humidity: number;
}

const REQUIRED_KEYS: AirGradientMetricKey[] = ['pm25', 'co2', 'voc', 'nox', 'temperature', 'humidity'];

export function mapAirGradientSnapshot(current: AirGradientCurrent): AirGradientSnapshot {
  const values = new Map(current.metrics.map((metric) => [metric.key, metric.value]));
  const missing = REQUIRED_KEYS.filter((key) => values.get(key) == null);
  if (missing.length) {
    throw new UpstreamError(
      `AirGradient current response is missing values for: ${missing.join(', ')}`,
      502,
      'airgradient_bad_response',
    );
  }

  return {
    pm25: round1(values.get('pm25')!),
    co2: Math.round(values.get('co2')!),
    voc: Math.round(values.get('voc')!),
    nox: Math.round(values.get('nox')!),
    temperature: round1(values.get('temperature')!),
    humidity: round1(values.get('humidity')!),
  };
}

export function rangeValues(range: AirGradientRange): number[] {
  return range.points.map(([, value]) => round1(value));
}

export function pm25ToUsAqi(pm25: number): number {
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ];
  const bp = breakpoints.find((item) => pm25 >= item.cLow && pm25 <= item.cHigh) ?? breakpoints[breakpoints.length - 1];
  return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
