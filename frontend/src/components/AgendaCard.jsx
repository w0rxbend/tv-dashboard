import { For, Show, createMemo } from 'solid-js';
import { ErrorState, SunArc } from '../primitives';
import { useNow } from '../data';
import { optionalResource } from '../data/emptyResource';

export default function AgendaCard(props) {
  const now = useNow(60_000); // update once per minute — enough for date header

  const dayLabel = createMemo(() =>
    now().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() +
    ' · ' +
    now().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  );

  const events = optionalResource(props.events);
  const daylight = optionalResource(props.daylight);

  const eventList = () => events.latest?.events ?? [];
  const hasEvents = () => Boolean(events.latest);
  const hasEventError = () => Boolean(events.error && events.error?.code !== 'cancelled');
  const sun       = () => daylight.latest;

  return (
    <article class="card card-lg agenda-card" aria-label="Today's agenda">
      {/* Header */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
        <div>
          <div class="t-label-md muted">{dayLabel()}</div>
          <div class="t-headline-lg" style={{ 'font-weight': 500 }}>Today</div>
        </div>
        <div style={{ 'text-align': 'right' }}>
          <div class="t-label-md muted">EVENTS</div>
          <div class="t-headline-lg t-num" style={{ 'font-weight': 500 }}>{hasEvents() ? eventList().length : '—'}</div>
        </div>
      </div>

      {/* Sun arc */}
      <Show when={sun()} fallback={
        <div style={{ height: '112px', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
          <span class="t-body-sm muted">Loading daylight…</span>
        </div>
      }>
        <SunArc
          progress={sun().progress}
          sunrise={sun().sunrise}
          sunset={sun().sunset}
          width={360}
          height={112}
        />
      </Show>

      {/* Event list */}
      <div class="agenda-list" role="list">
        <Show
          when={!hasEventError()}
          fallback={
            <ErrorState
              error={events.error}
              icon="event_busy"
              title="Calendar unavailable"
            />
          }
        >
          <Show
            when={hasEvents()}
            fallback={<div class="t-body-sm muted" style={{ padding: '12px 0' }}>Loading events…</div>}
          >
            <For each={eventList()} fallback={
              <div class="t-body-sm muted" style={{ padding: '12px 0' }}>No events today</div>
            }>
              {e => (
                <div classList={{ 'agenda-row': true, active: e.active }} role="listitem">
                  <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-start' }}>
                    <span class="time">{e.time}</span>
                    <span class="ampm">{e.ampm}</span>
                  </div>
                  <div>
                    <div class="title">{e.title}</div>
                    <div class="sub">{e.sub}</div>
                  </div>
                  <Show when={e.active}>
                    <span
                      aria-label="In progress"
                      style={{ position: 'absolute', right: '12px', top: '12px', width: '8px', height: '8px', 'border-radius': '50%', background: '#82DBA6', 'box-shadow': '0 0 0 4px rgba(130,219,166,0.20)' }}
                    />
                  </Show>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </article>
  );
}
