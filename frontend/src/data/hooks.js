import { createSignal, onCleanup } from 'solid-js';

/** Live clock signal — updates every `intervalMs` ms. */
export function createNow(intervalMs = 1000) {
  const [now, setNow] = createSignal(new Date());
  const id = setInterval(() => setNow(new Date()), intervalMs);
  onCleanup(() => clearInterval(id));
  return now;
}
