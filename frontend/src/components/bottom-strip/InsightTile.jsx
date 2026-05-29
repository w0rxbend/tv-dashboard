import { For } from 'solid-js';
import { MS } from '../../primitives';

export function InsightTile(props) {
  return (
    <div class="bs-cell primary" aria-live="polite" aria-label="Aurora insight">
      <div class="bs-insight-content">
        <div class="bs-icon">
          <MS name={props.insight.icon} size={32} fill/>
        </div>
        <div class="bs-insight-copy">
          <div class="t-label-md bs-insight-label">AURORA INSIGHT</div>
          <div class="t-title-lg bs-insight-title">{props.insight.title}</div>
          <div class="t-body-md bs-insight-sub">{props.insight.sub}</div>
        </div>
      </div>

      <div class="bs-progress-dots" aria-hidden="true">
        <For each={props.insights}>
          {(_, index) => (
            <span classList={{ active: index() === props.activeIndex }}/>
          )}
        </For>
      </div>
    </div>
  );
}
