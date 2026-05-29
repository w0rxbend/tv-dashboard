import { createMemo, For } from 'solid-js';
import { LineChart, CardError } from '../primitives';
import { optionalResource } from '../data/emptyResource';

const TELEMETRY_SERIES = [
  { id: 'pm25', label: 'PM2.5', color: '#FFB59A', unit: 'µg/m³' },
  { id: 'co2',  label: 'CO₂',   color: '#82DBA6', unit: 'ppm' },
  { id: 'voc',  label: 'TVOC',  color: '#D0BCFF', unit: 'index' },
  { id: 'nox',  label: 'NOx',   color: '#FFD68A', unit: 'index' },
];

const average = (values) => {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const maxValue = (values) => {
  if (!Array.isArray(values) || values.length === 0) return null;
  return Math.max(...values);
};

const formatNumber = (value, digits) => (
  Number.isFinite(value) ? value.toFixed(digits) : '—'
);

export default function ChartCard(props) {
  const readings = optionalResource(props.readings);
  const raw = () => readings.latest?.series;

  const series = createMemo(() => {
    const s = raw();
    if (!s) return [];
    return [
      { data: s.pm25, color: TELEMETRY_SERIES[0].color },
      { data: s.co2,  color: TELEMETRY_SERIES[1].color },
      { data: s.voc,  color: TELEMETRY_SERIES[2].color },
      { data: s.nox,  color: TELEMETRY_SERIES[3].color },
    ];
  });

  const peakPm25 = createMemo(() => formatNumber(maxValue(raw()?.pm25), 1));
  const peakCo2 = createMemo(() => formatNumber(maxValue(raw()?.co2), 0));
  const avgVoc = createMemo(() => formatNumber(average(raw()?.voc), 0));
  const avgNox = createMemo(() => formatNumber(average(raw()?.nox), 0));

  return (
    <article class="card card-lg chart-card" aria-label="Environmental telemetry">
      <CardError error={readings.error}/>
      <div class="chart-header">
        <div>
          <div class="t-label-md muted" style={{ 'font-size': '10px' }}>LAST 12 HOURS</div>
          <div class="t-title-md">Environmental telemetry</div>
        </div>

        {/* Legend */}
        <div class="chart-legend" role="list" aria-label="Series legend">
          <For each={TELEMETRY_SERIES}>
            {s => (
              <div class="chart-legend-item" role="listitem">
                <span
                  class="chart-legend-swatch"
                  style={{ background: s.color, 'box-shadow': `0 0 6px ${s.color}88` }}
                  aria-hidden="true"
                />
                <span class="t-label-md" style={{ color: s.color, 'font-size': '11px' }}>{s.label}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      <div style={{ flex: 1, 'min-height': 0, display: 'flex' }}>
        <LineChart
          width={820}
          height={120}
          padding={{ t: 8, r: 8, b: 22, l: 32 }}
          series={series()}
          label="12-hour AirGradient telemetry trend for PM2.5, CO2, TVOC, and NOx"
        />
      </div>

      <div class="chart-stats" role="list" aria-label="Statistics">
        <div class="chart-stat" role="listitem">
          <div class="lbl">PEAK PM2.5</div>
          <div><span class="v">{peakPm25()}</span><span class="u">µg/m³</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">PEAK CO₂</div>
          <div><span class="v">{peakCo2()}</span><span class="u">ppm</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">AVG TVOC</div>
          <div><span class="v">{avgVoc()}</span><span class="u">index</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">AVG NOx</div>
          <div><span class="v">{avgNox()}</span><span class="u">index</span></div>
        </div>
      </div>
    </article>
  );
}
