import { createMemo, mergeProps } from 'solid-js';

/**
 * Elliptical sunrise → sunset arc.
 * Progress 0 = puck at sunrise (left), 0.5 = zenith, 1 = sunset (right).
 * SVG overflow is intentionally visible so the glow doesn't clip at the top.
 */
export function SunArc(props) {
  const merged = mergeProps(
    { width: 360, height: 112, progress: 0.55, sunrise: '05:24', sunset: '21:42' },
    props,
  );

  const arc = createMemo(() => {
    const { width: w, height: h, progress } = merged;
    const MARGIN_X = 22;
    const LABEL_H  = 20;
    const cx = w / 2;
    const cy = h - LABEL_H;
    const rx = w / 2 - MARGIN_X;
    const ry = cy - 12;

    const p = Math.max(0, Math.min(1, progress));
    const a = Math.PI + Math.PI * p;
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);

    return {
      cx, cy, rx, ry, px, py,
      arcPath:  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`,
      fillPath: `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${px.toFixed(2)} ${py.toFixed(2)}`,
      daylight: Math.round(p * 16.3 * 10) / 10,
      marginX: MARGIN_X, w, h,
    };
  });

  return (
    <svg
      width="100%"
      height={merged.height}
      viewBox={`0 0 ${merged.width} ${merged.height}`}
      preserveAspectRatio="xMidYMax meet"
      style={{ display: 'block', overflow: 'visible' }}
      aria-label={`Sun position: ${arc().daylight}h of daylight elapsed. Sunrise ${merged.sunrise}, sunset ${merged.sunset}.`}
      role="img"
    >
      <defs>
        <linearGradient id="sunGrad" x1="0" x2="1">
          <stop offset="0%"   stop-color="#FFB59A"/>
          <stop offset="55%"  stop-color="#FFD68A"/>
          <stop offset="100%" stop-color="#82DBA6"/>
        </linearGradient>
      </defs>

      {/* Horizon baseline */}
      <line
        x1={arc().marginX - 6} y1={arc().cy}
        x2={arc().w - arc().marginX + 6} y2={arc().cy}
        stroke="var(--md-outline-variant)" stroke-width="1" stroke-opacity="0.6" stroke-dasharray="2 4"
      />
      {/* Full arc track */}
      <path d={arc().arcPath} fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"/>
      {/* Elapsed arc */}
      <path d={arc().fillPath} fill="none" stroke="url(#sunGrad)" stroke-width="3" stroke-linecap="round"/>
      {/* Sun puck */}
      <circle cx={arc().px} cy={arc().py} r="11" fill="#FFD68A" style={{ filter: 'drop-shadow(0 0 12px #FFD68Acc)' }}/>
      <circle cx={arc().px} cy={arc().py} r="4"  fill="#fff"/>

      {/* Time labels */}
      <text x={arc().marginX}   y={arc().h - 4} text-anchor="start"  font-size="11" font-family="Roboto Mono, monospace" fill="var(--md-on-surface-variant)" letter-spacing="0.1em">{merged.sunrise}</text>
      <text x={arc().w / 2}     y={arc().h - 4} text-anchor="middle" font-size="10" font-family="Roboto Mono, monospace" fill="var(--md-outline)"             letter-spacing="0.14em">DAYLIGHT · {arc().daylight}h</text>
      <text x={arc().w - arc().marginX} y={arc().h - 4} text-anchor="end" font-size="11" font-family="Roboto Mono, monospace" fill="var(--md-on-surface-variant)" letter-spacing="0.1em">{merged.sunset}</text>
    </svg>
  );
}
