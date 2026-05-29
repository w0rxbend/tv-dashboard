import { createMemo, For } from 'solid-js';
import { MS } from '../../primitives';
import { serviceSnapshot, summarizeStatuses } from '../../data/resourceStatus';

export function SystemStatusWidget(props) {
  const services = createMemo(() => [
    serviceSnapshot({ key: 'air',      label: 'AirGradient', icon: 'sensors',           resource: props.airQuality }),
    serviceSnapshot({ key: 'weather',  label: 'Weather',     icon: 'partly_cloudy_day', resource: props.weather }),
    serviceSnapshot({ key: 'calendar', label: 'Calendar',    icon: 'event_available',   resource: props.events }),
    serviceSnapshot({ key: 'tasks',    label: 'Reminders',   icon: 'checklist',         resource: props.reminders }),
    serviceSnapshot({ key: 'insights', label: 'Insights',    icon: 'auto_awesome',      resource: props.insights }),
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
