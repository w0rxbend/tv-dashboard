import { createMemo, For, Index, Show, mergeProps } from 'solid-js';
import { normalizeChartSeries } from './lineChartModel';

const X_LABELS = ['18:00', '21:00', '00:00', '03:00', 'NOW'];

/**
 * Multi-series area+line chart.
 *
 * Uses <Index> for series paths so streaming data updates the SVG `d` attribute
 * in-place without recreating DOM nodes — the spark-path animation only replays
 * when the component itself is (re)mounted.
 */
export function LineChart(props) {
  const merged = mergeProps(
    { width: 720, height: 220, padding: { t: 12, r: 12, b: 24, l: 36 } },
    props,
  );

  const computed = createMemo(() => {
    const { series, width, height, padding: p } = merged;
    const inner = { w: width - p.l - p.r, h: height - p.t - p.b };

    const validSeries = normalizeChartSeries(series);
    const all = validSeries.flatMap(s => s.data);

    if (!all.length) {
      const gridYs = [0, 1, 2, 3].map(i => p.t + (i / 3) * inner.h);
      const xTicks = [0, 0.25, 0.5, 0.75, 1].map(t => p.l + t * inner.w);
      return { empty: true, gridYs, gridLabels: ['', '', '', ''], xTicks, seriesPaths: [], p, width, height };
    }

    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min || 1;
    const n = validSeries[0]?.data.length || 2;

    const xAt = i => p.l + (i / Math.max(1, n - 1)) * inner.w;
    const yAt = v => p.t + inner.h - ((v - min) / span) * inner.h;

    const buildLine = data => {
      let d = `M ${xAt(0).toFixed(1)} ${yAt(data[0]).toFixed(1)}`;
      for (let i = 1; i < data.length; i++) {
        const px = xAt(i - 1), py = yAt(data[i - 1]);
        const cx = xAt(i),     cy = yAt(data[i]);
        const mx = (px + cx) / 2;
        d += ` Q ${mx.toFixed(1)} ${py.toFixed(1)}, ${mx.toFixed(1)} ${((py + cy) / 2).toFixed(1)} T ${cx.toFixed(1)} ${cy.toFixed(1)}`;
      }
      return d;
    };

    const gridYs    = [0, 1, 2, 3].map(i => p.t + (i / 3) * inner.h);
    const gridLabels = [0, 1, 2, 3].map(i => Math.round(max - (i / 3) * span));
    const xTicks    = [0, 0.25, 0.5, 0.75, 1].map(t => p.l + t * inner.w);

    const seriesPaths = validSeries.map((s, i) => {
      const line = buildLine(s.data);
      return {
        gid: `ar${i}`,
        color: s.color,
        line,
        area: `${line} L ${xAt(s.data.length - 1)} ${p.t + inner.h} L ${xAt(0)} ${p.t + inner.h} Z`,
        dotX: xAt(s.data.length - 1),
        dotY: yAt(s.data[s.data.length - 1]),
      };
    });

    return { empty: false, gridYs, gridLabels, xTicks, seriesPaths, p, width, height };
  });

  return (
    <svg
      width="100%"
      height={merged.height}
      viewBox={`0 0 ${merged.width} ${merged.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={merged.label ?? 'Telemetry line chart'}
    >
      <Show when={computed().empty}>
        <text
          x={computed().width / 2}
          y={computed().height / 2}
          text-anchor="middle"
          font-size="12"
          fill="var(--md-on-surface-variant)"
          font-family="Roboto, sans-serif"
        >
          Loading telemetry...
        </text>
      </Show>

      {/* Horizontal grid lines + Y-axis labels */}
      <For each={computed().gridYs}>
        {(y, i) => (
          <g>
            <line
              x1={computed().p.l} x2={computed().width - computed().p.r}
              y1={y} y2={y}
              stroke="var(--md-outline-variant)" stroke-opacity="0.45" stroke-dasharray="2 4"
            />
            <text
              x={computed().p.l - 8} y={y + 4}
              text-anchor="end" font-size="11"
              fill="var(--md-on-surface-variant)" font-family="Roboto Mono, monospace"
            >
              {computed().gridLabels[i()]}
            </text>
          </g>
        )}
      </For>

      {/* Series — Index keeps DOM stable for streaming updates */}
      <Index each={computed().seriesPaths}>
        {(s, i) => (
          <g>
            <defs>
              <linearGradient id={`ar${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stop-color={s().color} stop-opacity="0.30"/>
                <stop offset="100%" stop-color={s().color} stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d={s().area} fill={`url(#ar${i})`}/>
            <path class="spark-path" d={s().line} fill="none" stroke={s().color} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx={s().dotX} cy={s().dotY} r="4" fill={s().color}/>
            <circle cx={s().dotX} cy={s().dotY} r="8" fill={s().color} opacity="0.18"/>
          </g>
        )}
      </Index>

      {/* X-axis time labels */}
      <For each={computed().xTicks}>
        {(x, i) => (
          <text
            x={x} y={computed().height - 6}
            text-anchor="middle" font-size="10"
            fill="var(--md-on-surface-variant)" font-family="Roboto Mono, monospace" letter-spacing="0.08em"
          >
            {X_LABELS[i()]}
          </text>
        )}
      </For>
    </svg>
  );
}
