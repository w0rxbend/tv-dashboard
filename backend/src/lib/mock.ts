/** Bounded random jitter around a base value. */
export function jitter(base: number, amp: number): number {
  return +(base + (Math.random() - 0.5) * 2 * amp).toFixed(2);
}

/** Integer-bounded jitter. */
export function jitterInt(base: number, amp: number): number {
  return Math.round(base + (Math.random() - 0.5) * 2 * amp);
}

/**
 * Seeded pseudo-random walk series — deterministic shape, realistic variation.
 * Same seed → same shape; called fresh each request to add a slight roll.
 */
export function makeSeries(n: number, base: number, amp: number, seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  let v = base;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v += (s / 233280 - 0.5) * amp;
    v = Math.max(base * 0.4, Math.min(base * 1.7, v));
    out.push(+v.toFixed(2));
  }
  return out;
}

/** Rolling series: drops first point, appends a new jittered value. */
export function rollSeries(series: number[], base: number, amp: number): number[] {
  const last = series[series.length - 1];
  let next = last + (Math.random() - 0.5) * amp * 2;
  next = Math.max(base * 0.4, Math.min(base * 1.7, next));
  return [...series.slice(1), +next.toFixed(2)];
}
