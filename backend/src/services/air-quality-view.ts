import type { AirGradientCurrent, AirGradientRange } from './airgradient.js';
import { mapAirGradientSnapshot, pm25ToUsAqi, rangeValues } from './airgradient-view.js';

function aqiCategory(aqi: number) {
  if (aqi <= 50)  return { name: 'Good',       color: '#82DBA6', container: 'var(--md-good-container)',      on: 'var(--md-on-good-container)' };
  if (aqi <= 100) return { name: 'Moderate',   color: '#FFD68A', container: 'var(--md-warn-container)',      on: 'var(--md-on-warn-container)' };
  if (aqi <= 150) return { name: 'Unhealthy*', color: '#FFB59A', container: 'var(--md-tertiary-container)',  on: 'var(--md-on-tertiary-container)' };
  if (aqi <= 200) return { name: 'Unhealthy',  color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
  return               { name: 'Hazardous',    color: '#FFB4AB', container: 'var(--md-bad-container)',       on: 'var(--md-on-bad-container)' };
}

function aqiMessage(aqi: number): string {
  if (aqi <= 50)  return 'Air quality is Good — safe for all activities';
  if (aqi <= 100) return 'Air quality is Moderate — sensitive groups take care';
  if (aqi <= 150) return 'Unhealthy for sensitive groups — limit prolonged outdoor exertion';
  if (aqi <= 200) return 'Unhealthy — reduce outdoor activities';
  return                 'Hazardous — avoid all outdoor activities';
}

export function mapAirQualityView(
  current: AirGradientCurrent,
  ranges: { pm25: AirGradientRange; co2: AirGradientRange; voc: AirGradientRange; nox: AirGradientRange },
) {
  const snapshot = mapAirGradientSnapshot(current);
  const aqi = pm25ToUsAqi(snapshot.pm25);
  const category = aqiCategory(aqi);

  return {
    aqi,
    category,
    pm25: snapshot.pm25,
    co2:  snapshot.co2,
    voc:  snapshot.voc,
    nox:  snapshot.nox,
    message: aqiMessage(aqi),
    sparklines: {
      pm25: rangeValues(ranges.pm25),
      co2:  rangeValues(ranges.co2),
      voc:  rangeValues(ranges.voc),
      nox:  rangeValues(ranges.nox),
    },
  };
}

export function mapAirQualityReadings(ranges: AirGradientRange[]) {
  const [pm25, co2, voc, nox] = ranges;
  const series = {
    pm25: rangeValues(pm25),
    co2:  rangeValues(co2),
    voc:  rangeValues(voc),
    nox:  rangeValues(nox),
  };
  const count = Math.max(series.pm25.length, series.co2.length, series.voc.length, series.nox.length);

  return {
    window:     pm25.range,
    resolution: pm25.step,
    count,
    series,
  };
}
