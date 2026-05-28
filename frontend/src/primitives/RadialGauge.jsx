import { createMemo, For, mergeProps } from 'solid-js';

/** Material 3 circular progress gauge with tick marks and glow. */
export function RadialGauge(props) {
  const merged = mergeProps({ size: 280, max: 300, color: '#B4C5FF', track: 'rgba(255,255,255,0.10)' }, props);

  // Static geometry — only depends on size (constant per usage site)
  const geom = createMemo(() => {
    const sz = merged.size;
    const SWEEP = 270;
    const START = 135;
    const R = sz / 2 - 18;
    const C = sz / 2;
    const circ = 2 * Math.PI * R;
    const lenForFull = circ * (SWEEP / 360);
    const rot = -90 - (360 - SWEEP) / 2;

    const ticks = Array.from({ length: 31 }, (_, i) => {
      const a = (START + (SWEEP * i) / 30) * (Math.PI / 180);
      const r1 = R - 12, r2 = R - 4;
      return { x1: C + r1 * Math.cos(a), y1: C + r1 * Math.sin(a), x2: C + r2 * Math.cos(a), y2: C + r2 * Math.sin(a), i };
    });

    return { R, C, circ, lenForFull, rot, ticks };
  });

  const offset = createMemo(() => {
    const pct = Math.max(0, Math.min(1, props.value / merged.max));
    return geom().lenForFull * (1 - pct);
  });

  return (
    <svg
      width={merged.size}
      height={merged.size}
      viewBox={`0 0 ${merged.size} ${merged.size}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <g transform={`rotate(${geom().rot} ${geom().C} ${geom().C})`}>
        {/* Track */}
        <circle
          cx={geom().C} cy={geom().C} r={geom().R}
          fill="none" stroke={merged.track} stroke-width="14" stroke-linecap="round"
          stroke-dasharray={`${geom().lenForFull} ${geom().circ - geom().lenForFull}`}
          stroke-dashoffset="0"
        />
        {/* Fill with glow */}
        <circle
          cx={geom().C} cy={geom().C} r={geom().R}
          fill="none" stroke={merged.color} stroke-width="14" stroke-linecap="round"
          stroke-dasharray={`${geom().lenForFull} ${geom().circ - geom().lenForFull}`}
          stroke-dashoffset={offset()}
          style={{
            filter: `drop-shadow(0 0 12px ${merged.color}aa)`,
            transition: 'stroke-dashoffset 1.4s var(--ease-emphasized)',
          }}
        />
      </g>
      <For each={geom().ticks}>
        {tick => (
          <line
            x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
            stroke={tick.i % 5 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}
            stroke-width={tick.i % 5 === 0 ? 1.5 : 1}
            stroke-linecap="round"
          />
        )}
      </For>
    </svg>
  );
}
