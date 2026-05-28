import { createSignal, onMount, onCleanup, For } from 'solid-js';
import { MS, LinearTrack } from '../primitives';
import { createPolling } from '../data/createPolling';
import { fetchInsights, fetchReminders, fetchDevices, fetchWeather, POLL } from '../api';

const ROTATE_MS = 6000;

export default function BottomStrip() {
  const [idx, setIdx] = createSignal(0);

  const insights  = createPolling(fetchInsights,  { interval: POLL.INSIGHTS });
  const reminders = createPolling(fetchReminders, { interval: POLL.REMINDERS });
  const devices   = createPolling(fetchDevices,   { interval: POLL.DEVICES });
  const weather   = createPolling(fetchWeather,   { interval: POLL.WEATHER });

  const insightList = () => insights.latest?.insights ?? [];
  const wx          = () => weather.latest?.current;

  onMount(() => {
    const id = setInterval(() => setIdx(i => {
      const len = insightList().length;
      return len ? (i + 1) % len : 0;
    }), ROTATE_MS);
    onCleanup(() => clearInterval(id));
  });

  const insight = () => insightList()[idx()] ?? { icon: 'auto_awesome', title: '…', sub: '' };


  return (
    <section class="bottom-strip" aria-label="Status strip">
      {/* Rotating Aurora insight */}
      <div class="bs-cell primary" aria-live="polite" aria-label="Aurora insight">
        <div style={{ display: 'flex', 'align-items': 'center', gap: '14px' }}>
          <div class="bs-icon">
            <MS name={insight().icon} size={32} fill/>
          </div>
          <div style={{ 'min-width': 0 }}>
            <div class="t-label-md" style={{ opacity: 0.75 }}>AURORA INSIGHT</div>
            <div class="t-title-lg" style={{ 'margin-top': '2px', 'font-weight': 500 }}>{insight().title}</div>
            <div class="t-body-md"  style={{ opacity: 0.8,  'margin-top': '2px' }}>{insight().sub}</div>
          </div>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', 'margin-top': '8px' }} aria-hidden="true">
          <For each={insightList()}>
            {(_, i) => (
              <span style={{
                height: '4px', flex: 1, 'border-radius': '4px',
                background: i() === idx() ? 'currentColor' : 'rgba(255,255,255,0.16)',
                transition: 'background 400ms',
              }}/>
            )}
          </For>
        </div>
      </div>

      {/* Reminders */}
      <div class="bs-cell">
        <MS name="checklist" class="bs-cell-icon" aria-hidden="true"/>
        <div class="t-label-md muted">NEXT REMINDERS</div>
        <For each={(reminders.latest?.reminders ?? []).slice(0, 3)}>
          {r => (
            <div class="reminder-row">
              <span classList={{ dot: true, done: r.done }} aria-hidden="true"/>
              <span
                class="text"
                style={{
                  color: r.done ? 'var(--md-on-surface-variant)' : 'inherit',
                  'text-decoration': r.done ? 'line-through' : 'none',
                }}
              >
                {r.text}
              </span>
              <span class="when">{r.when}</span>
            </div>
          )}
        </For>
      </div>

      {/* Device mesh */}
      <div class="bs-cell">
        <MS name="device_hub" class="bs-cell-icon" aria-hidden="true"/>
        <div class="t-label-md muted">DEVICE MESH</div>
        <div class="t-display-sm t-num" style={{ 'font-weight': 300, 'letter-spacing': '-0.03em' }}>
          {devices.latest?.online ?? '—'}
          <span class="t-title-md muted" style={{ 'margin-left': '6px' }}>/{devices.latest?.total ?? '—'}</span>
        </div>
        <div class="t-body-sm muted">
          all sensors online · {devices.latest?.latency_ms ?? '—'} ms
        </div>
      </div>

      {/* Wind */}
      <div class="bs-cell">
        <MS name="air" class="bs-cell-icon" aria-hidden="true"/>
        <div class="t-label-md muted">OUTDOOR WIND</div>
        <div style={{ display: 'flex', 'align-items': 'baseline', gap: '6px' }}>
          <span class="t-display-sm t-num" style={{ 'font-weight': 300, 'letter-spacing': '-0.03em' }}>
            {wx()?.wind_speed?.toFixed(0) ?? '—'}
          </span>
          <span class="t-title-md muted">km/h</span>
        </div>
        <div class="t-body-sm muted">
          {wx() ? `${wx().wind_direction} · ${wx().condition_label}` : 'loading…'}
        </div>
      </div>

      {/* UV Index */}
      <div class="bs-cell">
        <MS name="wb_sunny" class="bs-cell-icon" aria-hidden="true"/>
        <div class="t-label-md muted">UV INDEX</div>
        <span class="t-display-sm t-num" style={{ 'font-weight': 300 }}>{wx()?.uv_index ?? '—'}</span>
        <div class="t-body-sm muted">
          {wx() ? `${wx().uv_label} — ${wx().uv_advice}` : 'loading…'}
        </div>
      </div>
    </section>
  );
}
