/**
 * Seeded pseudo-random time series generator.
 * Produces deterministic, visually natural-looking data for mock sensors.
 *
 * @param {number} n      Number of data points
 * @param {number} base   Centre value
 * @param {number} amp    Max deviation per step
 * @param {number} seed   PRNG seed (same seed → same series)
 * @returns {number[]}
 */
export function makeSeries(n, base = 40, amp = 12, seed = 7) {
  const out = [];
  let s = seed;
  let v = base;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v += (s / 233280 - 0.5) * amp;
    v = Math.max(base * 0.4, Math.min(base * 1.7, v));
    out.push(v);
  }
  return out;
}

/** US EPA AQI category lookup — returns display name, accent colour, and M3 tonal container pair. */
export function aqiCategory(aqi) {
  if (aqi <= 50)  return { name: 'Good',       color: '#82DBA6', container: 'var(--md-good-container)',      on: 'var(--md-on-good-container)' };
  if (aqi <= 100) return { name: 'Moderate',   color: '#FFD68A', container: 'var(--md-warn-container)',      on: 'var(--md-on-warn-container)' };
  if (aqi <= 150) return { name: 'Unhealthy*', color: '#FFB59A', container: 'var(--md-tertiary-container)', on: 'var(--md-on-tertiary-container)' };
  if (aqi <= 200) return { name: 'Unhealthy',  color: '#FFB4AB', container: 'var(--md-bad-container)',      on: 'var(--md-on-bad-container)' };
  return           { name: 'Hazardous',         color: '#FFB4AB', container: 'var(--md-bad-container)',      on: 'var(--md-on-bad-container)' };
}
