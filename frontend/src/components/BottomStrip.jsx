import { createMemo, createSignal, onMount, onCleanup, For } from 'solid-js';
import { MS } from '../primitives';
import { createPolling } from '../data/createPolling';
import { serviceSnapshot, summarizeStatuses } from '../data/resourceStatus';
import { fetchInsights, fetchReminders, fetchWeather, fetchAirQuality, fetchEvents, POLL } from '../api';

const ROTATE_MS = 6000;
const WIND_SPEED_MAX = 70;
const UV_SCALE_MAX = 11;

const WIND_THEMES = {
  calm:   { accent: '#B8D7FF', ink: '#D9EAFF', soft: 'rgba(90, 151, 214, 0.20)' },
  light:  { accent: '#9FD7FF', ink: '#D8F0FF', soft: 'rgba(63, 171, 226, 0.22)' },
  breezy: { accent: '#86D7D5', ink: '#D8F7F6', soft: 'rgba(83, 190, 188, 0.22)' },
  windy:  { accent: '#FFD68A', ink: '#FFF0CE', soft: 'rgba(255, 214, 138, 0.20)' },
  strong: { accent: '#FFB4AB', ink: '#FFDAD6', soft: 'rgba(255, 180, 171, 0.22)' },
};

const UV_THEMES = {
  low:       { accent: '#82DBA6', soft: 'rgba(130, 219, 166, 0.22)', ink: '#D9F8E6' },
  moderate:  { accent: '#FFD68A', soft: 'rgba(255, 214, 138, 0.24)', ink: '#FFF0CE' },
  high:      { accent: '#FFB59A', soft: 'rgba(255, 181, 154, 0.25)', ink: '#FFE1D5' },
  very_high: { accent: '#FFB4AB', soft: 'rgba(255, 180, 171, 0.27)', ink: '#FFDAD6' },
  extreme:   { accent: '#D0BCFF', soft: 'rgba(208, 188, 255, 0.25)', ink: '#EADDFF' },
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function normalizedNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function SystemStatusWidget(props) {
  const services = createMemo(() => [
    serviceSnapshot({ key: 'air',      label: 'AirGradient', icon: 'sensors',         resource: props.airQuality }),
    serviceSnapshot({ key: 'weather',  label: 'Weather',     icon: 'partly_cloudy_day', resource: props.weather }),
    serviceSnapshot({ key: 'calendar', label: 'Calendar',    icon: 'event_available', resource: props.events }),
    serviceSnapshot({ key: 'tasks',    label: 'Reminders',   icon: 'checklist',       resource: props.reminders }),
  ]);
  const counts = createMemo(() => summarizeStatuses(services().map((item) => item.status)));
  const summary = createMemo(() => {
    if (counts().down) return `${counts().down} feed${counts().down === 1 ? '' : 's'} unavailable`;
    if (counts().checking) return 'Checking data feeds';
    return 'All systems operational';
  });

  return (
    <div
      class="status-widget"
      classList={{
        'has-issues': counts().down > 0,
        'is-checking': counts().checking > 0 && counts().down === 0,
      }}
    >
      <div class="status-head">
        <span class="status-icon-chip" aria-hidden="true">
          <MS name={counts().down ? 'error' : 'verified'} size={20} fill/>
        </span>
        <span class="t-label-md">SYSTEM STATUS</span>
      </div>

      <div class="status-summary">
        <div class="status-title">{summary()}</div>
        <div class="status-subline">{counts().live}/{counts().total} feeds reachable</div>
      </div>

      <div class="status-grid" role="list">
        <For each={services()}>
          {(service) => (
            <div class="status-service" classList={{ [service.status]: true }} role="listitem">
              <MS name={service.icon} size={18} aria-hidden="true"/>
              <span class="status-service-label">{service.label}</span>
              <span class="status-dot" aria-hidden="true"/>
              <span class="status-service-message">{service.message}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function normalizedDegrees(value) {
  const number = normalizedNumber(value);
  if (number == null) return null;
  return Math.round(((number % 360) + 360) % 360);
}

function windLevelFromSpeed(speed) {
  if (speed == null) return 'calm';
  if (speed < 2) return 'calm';
  if (speed < 13) return 'light';
  if (speed < 29) return 'breezy';
  if (speed < 39) return 'windy';
  return 'strong';
}

function uvLevelFromIndex(index) {
  if (index == null) return 'low';
  if (index <= 2) return 'low';
  if (index <= 5) return 'moderate';
  if (index <= 7) return 'high';
  if (index <= 10) return 'very_high';
  return 'extreme';
}

function WindWidget(props) {
  const current = createMemo(() => props.weather);
  const speed = createMemo(() => normalizedNumber(current()?.wind_speed));
  const gust = createMemo(() => normalizedNumber(current()?.wind_gust));
  const bearing = createMemo(() => normalizedDegrees(current()?.wind_degrees) ?? 0);
  const level = createMemo(() => current()?.wind_level ?? windLevelFromSpeed(speed()));
  const theme = createMemo(() => WIND_THEMES[level()] ?? WIND_THEMES.calm);
  const strength = createMemo(() => {
    const value = Math.max(speed() ?? 0, gust() ?? 0);
    return `${Math.round(clamp01(value / WIND_SPEED_MAX) * 100)}%`;
  });
  const speedText = createMemo(() => speed() == null ? '—' : Math.round(speed()));
  const gustText = createMemo(() => gust() == null ? '—' : Math.round(gust()));
  const direction = createMemo(() => current()?.wind_direction ?? '—');
  const label = createMemo(() => current()?.wind_label ?? 'Loading');
  const advice = createMemo(() => current()?.wind_advice ?? 'Waiting for wind data');

  return (
    <div
      class="wind-widget"
      classList={{ 'is-loading': !current() }}
      style={{
        '--wind-accent':   theme().accent,
        '--wind-ink':      theme().ink,
        '--wind-soft':     theme().soft,
        '--wind-angle':    `${bearing()}deg`,
        '--wind-strength': strength(),
      }}
    >
      <div class="wind-head">
        <span class="wind-icon-chip" aria-hidden="true">
          <MS name="air" size={20}/>
        </span>
        <span class="t-label-md">OUTDOOR WIND</span>
      </div>

      <div class="wind-main">
        <div class="wind-compass" aria-hidden="true">
          <span class="wind-cardinal n">N</span>
          <span class="wind-cardinal e">E</span>
          <span class="wind-cardinal s">S</span>
          <span class="wind-cardinal w">W</span>
          <span class="wind-arrow"/>
          <div class="wind-center">
            <div class="wind-speed t-num">{speedText()}</div>
            <div class="wind-unit">km/h</div>
          </div>
        </div>

        <div class="wind-readout">
          <div class="wind-label">{label()}</div>
          <div class="wind-stat">
            <span>From</span>
            <strong>{direction()}</strong>
          </div>
          <div class="wind-stat">
            <span>Gust</span>
            <strong>{gustText()} <small>km/h</small></strong>
          </div>
        </div>
      </div>

      <div class="wind-meter" aria-hidden="true">
        <span/>
      </div>

      <div class="wind-advice">{advice()}</div>
    </div>
  );
}

function UvIndexWidget(props) {
  const current = createMemo(() => props.weather);
  const uvIndex = createMemo(() => normalizedNumber(current()?.uv_index));
  const uvProgress = createMemo(() => {
    const progress = normalizedNumber(current()?.uv_progress);
    if (progress != null) return clamp01(progress);

    const index = uvIndex();
    return index == null ? 0 : clamp01(index / UV_SCALE_MAX);
  });
  const uvLevel = createMemo(() => current()?.uv_level ?? uvLevelFromIndex(uvIndex()));
  const theme = createMemo(() => UV_THEMES[uvLevel()] ?? UV_THEMES.low);
  const fill = createMemo(() => `${Math.round(uvProgress() * 100)}%`);
  const value = createMemo(() => uvIndex() == null ? '—' : Math.round(uvIndex()));
  const label = createMemo(() => current()?.uv_label ?? 'Loading');
  const advice = createMemo(() => current()?.uv_advice ?? 'Waiting for solar data');
  const maxToday = createMemo(() => normalizedNumber(current()?.uv_max_today));

  return (
    <div
      class="uv-widget"
      classList={{ 'is-loading': !current() }}
      style={{
        '--uv-accent':      theme().accent,
        '--uv-accent-soft': theme().soft,
        '--uv-ink':         theme().ink,
        '--uv-fill':        fill(),
      }}
    >
      <div class="uv-head">
        <span class="uv-icon-chip" aria-hidden="true">
          <MS name="wb_sunny" size={20} fill/>
        </span>
        <span class="t-label-md">UV INDEX</span>
      </div>

      <div class="uv-main">
        <div class="uv-badge" aria-hidden="true">
          <div class="uv-badge-fill"/>
          <div class="uv-badge-glass"/>
          <span class="uv-badge-max">11+</span>
          <span class="uv-badge-zero">0</span>
        </div>

        <div class="uv-readout">
          <div class="uv-value t-num">{value()}</div>
          <div class="uv-label">{label()}</div>
          <div class="uv-peak">
            <span>Max</span>
            <strong>{maxToday() == null ? '—' : Math.round(maxToday())}</strong>
          </div>
        </div>
      </div>

      <div class="uv-track-wrap" aria-hidden="true">
        <div class="uv-track">
          <span class="uv-track-marker"/>
        </div>
      </div>

      <div class="uv-advice">{advice()}</div>
    </div>
  );
}

export default function BottomStrip(props) {
  const [idx, setIdx] = createSignal(0);

  const insights  = createPolling(fetchInsights,  { interval: POLL.INSIGHTS });
  const reminders = props.reminders ?? createPolling(fetchReminders, { interval: POLL.REMINDERS });
  const weather   = props.weather   ?? createPolling(fetchWeather,   { interval: POLL.WEATHER });
  const airQuality = props.airQuality ?? createPolling(fetchAirQuality, { interval: POLL.AIR_QUALITY });
  const events     = props.events     ?? createPolling(fetchEvents,     { interval: POLL.EVENTS });

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

      {/* System status */}
      <div class="bs-cell status-cell" aria-label="System status">
        <SystemStatusWidget
          airQuality={airQuality}
          weather={weather}
          events={events}
          reminders={reminders}
        />
      </div>

      {/* Wind */}
      <div
        class="bs-cell wind-cell"
        aria-label={wx() ? `Outdoor wind ${Math.round(wx().wind_speed)} kilometers per hour from ${wx().wind_direction}` : 'Outdoor wind loading'}
      >
        <WindWidget weather={wx()}/>
      </div>

      {/* UV Index */}
      <div
        class="bs-cell uv-cell"
        aria-label={wx() ? `UV index ${wx().uv_index}, ${wx().uv_label}` : 'UV index loading'}
      >
        <UvIndexWidget weather={wx()}/>
      </div>
    </section>
  );
}
