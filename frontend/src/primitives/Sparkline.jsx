import { createMemo, mergeProps } from 'solid-js';

/** Unique gradient ID per instance — stable for the component's lifetime. */
const uid = (() => { let n = 0; return () => `sg${++n}`; })();

/** Smooth quadratic-bezier sparkline with optional area fill. */
export function Sparkline(props) {
  const merged = mergeProps({ width: 120, height: 36, color: 'currentColor', fill: true, strokeW: 2 }, props);
  const gid = uid();

  const paths = createMemo(() => {
    const { data, width, height } = merged;
    if (!data || data.length < 2) return { d: '', fd: '' };

    const n = data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const x = i => (i / (n - 1)) * width;
    const y = v => height - ((v - min) / span) * (height - 4) - 2;

    let path = `M ${x(0).toFixed(1)} ${y(data[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) {
      const px = x(i - 1), py = y(data[i - 1]);
      const cx = x(i),     cy = y(data[i]);
      const mx = (px + cx) / 2;
      path += ` Q ${mx.toFixed(1)} ${py.toFixed(1)}, ${mx.toFixed(1)} ${((py + cy) / 2).toFixed(1)} T ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }

    return { d: path, fd: `${path} L ${width} ${height} L 0 ${height} Z` };
  });

  return (
    <svg
      width={merged.width}
      height={merged.height}
      viewBox={`0 0 ${merged.width} ${merged.height}`}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {merged.fill && (
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stop-color={merged.color} stop-opacity="0.32"/>
            <stop offset="100%" stop-color={merged.color} stop-opacity="0"/>
          </linearGradient>
        </defs>
      )}
      {merged.fill && <path d={paths().fd} fill={`url(#${gid})`}/>}
      <path
        d={paths().d}
        fill="none"
        stroke={merged.color}
        stroke-width={merged.strokeW}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
