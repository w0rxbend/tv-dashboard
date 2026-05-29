import { createMemo, For } from 'solid-js';
import { LineChart, CardError } from '../primitives';
import { createPolling } from '../data/createPolling';
import { fetchAirQualityReadings, POLL } from '../api';

const PM_SERIES = [
  { id: 'pm03', label: 'PM0.3', color: '#B4C5FF' },
  { id: 'pm1',  label: 'PM1',   color: '#82DBA6' },
  { id: 'pm25', label: 'PM2.5', color: '#FFB59A' },
  { id: 'pm10', label: 'PM10',  color: '#FFD68A' },
];

export default function ChartCard() {
  const readings = createPolling(fetchAirQualityReadings, { interval: POLL.AIR_QUALITY });

  const raw = () => readings.latest?.series;

  const series = createMemo(() => {
    const s = raw();
    if (!s) return [];
    return [
      { data: s.pm03, color: PM_SERIES[0].color },
      { data: s.pm1,  color: PM_SERIES[1].color },
      { data: s.pm25, color: PM_SERIES[2].color },
      { data: s.pm10, color: PM_SERIES[3].color },
    ];
  });

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  const peakPm25 = createMemo(() => raw() ? Math.max(...raw().pm25).toFixed(1) : '—');
  const peakPm10 = createMemo(() => raw() ? Math.max(...raw().pm10).toFixed(1) : '—');
  const avgPm1   = createMemo(() => raw() ? avg(raw().pm1).toFixed(1) : '—');
  const avgPm03  = createMemo(() => raw() ? avg(raw().pm03).toFixed(0) : '—');

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
          <For each={PM_SERIES}>
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
          label="12-hour particulate telemetry trend for PM0.3, PM1, PM2.5, and PM10"
        />
      </div>

      <div class="chart-stats" role="list" aria-label="Statistics">
        <div class="chart-stat" role="listitem">
          <div class="lbl">PEAK PM2.5</div>
          <div><span class="v">{peakPm25()}</span><span class="u">µg/m³</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">PEAK PM10</div>
          <div><span class="v">{peakPm10()}</span><span class="u">µg/m³</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">AVG PM1</div>
          <div><span class="v">{avgPm1()}</span><span class="u">µg/m³</span></div>
        </div>
        <div class="chart-stat" role="listitem">
          <div class="lbl">AVG PM0.3</div>
          <div><span class="v">{avgPm03()}</span><span class="u">µg/m³</span></div>
        </div>
      </div>
    </article>
  );
}
