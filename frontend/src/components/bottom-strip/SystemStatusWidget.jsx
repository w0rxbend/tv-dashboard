import { createMemo, For } from 'solid-js';
import { MS } from '../../primitives';
import { createSystemStatusModel } from './systemStatusViewModel';

export function SystemStatusWidget(props) {
  const model = createMemo(() => createSystemStatusModel(props));
  const counts = () => model().counts;

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
        <div class="status-title">{model().summary}</div>
        <div class="status-subline">{counts().live}/{counts().total} feeds reachable</div>
      </div>

      <div class="status-grid" role="list">
        <For each={model().services}>
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
