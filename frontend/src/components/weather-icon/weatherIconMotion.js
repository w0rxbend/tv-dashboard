import { onCleanup, onMount } from 'solid-js';
import gsap from 'gsap';

export function createWeatherIconAnimation(enabled, setup) {
  onMount(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let context = null;

    const shouldAnimate = () => enabled() && !media?.matches;
    const stop = () => {
      context?.revert();
      context = null;
    };
    const sync = () => {
      if (shouldAnimate()) {
        if (!context) context = gsap.context(setup);
      } else {
        stop();
      }
    };

    sync();
    media?.addEventListener?.('change', sync);
    onCleanup(() => {
      media?.removeEventListener?.('change', sync);
      stop();
    });
  });
}
