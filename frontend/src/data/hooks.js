import { createSignal, onCleanup } from 'solid-js';

/** Live clock signal — updates every `intervalMs` ms. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = createSignal(new Date());
  const id = setInterval(() => setNow(new Date()), intervalMs);
  onCleanup(() => clearInterval(id));
  return now;
}

/**
 * Slowly drifting numeric signal — simulates a live sensor reading.
 * Stays within [min, max] with smooth random walk.
 */
export function useDrift(start, { min, max, step = 0.6, ms = 1500 } = {}) {
  const [v, setV] = createSignal(start);
  const id = setInterval(() => {
    setV(prev => {
      const next = prev + (Math.random() - 0.5) * step * 2;
      if (typeof min === 'number' && next < min) return min + Math.random() * step;
      if (typeof max === 'number' && next > max) return max - Math.random() * step;
      return next;
    });
  }, ms);
  onCleanup(() => clearInterval(id));
  return v;
}

/**
 * Rolling time-series signal — appends a new point and drops the oldest
 * on each tick, simulating a live streaming chart.
 */
export function useStream(initial, { ms = 1500, jitter = 4, min = 0, max = 999 } = {}) {
  const [data, setData] = createSignal([...initial]);
  const id = setInterval(() => {
    setData(prev => {
      const last = prev[prev.length - 1];
      let nx = last + (Math.random() - 0.5) * jitter * 2;
      if (nx < min) nx = min + Math.random() * jitter;
      if (nx > max) nx = max - Math.random() * jitter;
      return [...prev.slice(1), nx];
    });
  }, ms);
  onCleanup(() => clearInterval(id));
  return data;
}
