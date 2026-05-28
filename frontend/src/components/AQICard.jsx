import { createMemo } from 'solid-js';
import { MS, Sparkline, RadialGauge, CardError } from '../primitives';
import { createPolling } from '../data/createPolling';
import { fetchAirQuality, POLL } from '../api';

export default function AQICard() {
  const aq = createPolling(fetchAirQuality, { interval: POLL.AIR_QUALITY });

  const data    = () => aq.latest;
  const aqiInt  = () => data()?.aqi ?? 0;
  const cat     = () => data()?.category ?? { color: '#B4C5FF', container: 'var(--md-primary-container)', on: 'var(--md-on-primary-container)', name: '…' };
  const sparks  = () => data()?.sparklines;

  return (
    <article class="card card-xl aqi-hero" aria-label="Air Quality Index">
      <CardError error={aq.error}/>
      {/* Decorative M3 shape blob */}
      <svg class="shape-blob" style={{ right: '-60px', top: '-60px', width: '280px', height: '280px' }} viewBox="0 0 200 200" aria-hidden="true">
        <path d="M 100 0 C 160 0 200 40 200 100 C 200 160 160 200 100 200 C 40 200 0 160 0 100 C 0 40 40 0 100 0 Z" fill={cat().color} opacity="0.35"/>
      </svg>

      {/* Radial gauge */}
      <div class="aqi-gauge-wrap">
        <RadialGauge value={aqiInt()} max={200} size={320} color={cat().color}/>
        <div class="aqi-gauge-center">
          <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '4px' }}>
            <span class="t-label-md muted" style={{ opacity: 0.85 }}>US AQI · INDOOR</span>
            <span
              class="t-display-lg t-num"
              style={{ color: cat().color, 'font-weight': 300, 'letter-spacing': '-0.05em', 'text-shadow': `0 0 30px ${cat().color}66` }}
              aria-live="polite"
              aria-label={`AQI ${aqiInt()}`}
            >
              {aqiInt() || '—'}
            </span>
            <span class="chip" style={{ background: cat().container, color: cat().on, 'margin-top': '2px' }}>
              <span style={{ width: '8px', height: '8px', 'border-radius': '50%', background: cat().color, 'box-shadow': `0 0 8px ${cat().color}aa` }} aria-hidden="true"/>
              {cat().name} air quality
            </span>
          </div>
        </div>
      </div>

      {/* Metrics panel */}
      <div class="aqi-side">
        <div>
          <div class="t-label-md" style={{ opacity: 0.7, 'margin-bottom': '6px' }}>LIVE PARTICULATE READOUT</div>
          <div class="t-headline-md" style={{ 'font-weight': 400 }}>
            {data()?.message ?? 'Loading sensor data…'}
          </div>
        </div>

        <div class="aqi-metric-row">
          <div class="aqi-metric">
            <span class="lbl">PM<sub style={{ 'font-size': '9px' }}>2.5</sub></span>
            <span><span class="v">{data()?.pm25?.toFixed(1) ?? '—'}</span><span class="u">µg/m³</span></span>
            {sparks() && <Sparkline data={sparks().pm25} width={140} height={26} color="#FFB59A"/>}
          </div>
          <div class="aqi-metric">
            <span class="lbl">PM<sub style={{ 'font-size': '9px' }}>10</sub></span>
            <span><span class="v">{data()?.pm10?.toFixed(1) ?? '—'}</span><span class="u">µg/m³</span></span>
            {sparks() && <Sparkline data={sparks().pm10} width={140} height={26} color="#FFD68A"/>}
          </div>
          <div class="aqi-metric">
            <span class="lbl">CO<sub style={{ 'font-size': '9px' }}>2</sub></span>
            <span><span class="v">{data()?.co2 ?? '—'}</span><span class="u">ppm</span></span>
            {sparks() && <Sparkline data={sparks().co2} width={140} height={26} color="#82DBA6"/>}
          </div>
          <div class="aqi-metric">
            <span class="lbl">tVOC</span>
            <span><span class="v">{data()?.voc?.toFixed(2) ?? '—'}</span><span class="u">mg/m³</span></span>
            {sparks() && <Sparkline data={sparks().voc} width={140} height={26} color="#D0BCFF"/>}
          </div>
        </div>
      </div>
    </article>
  );
}
