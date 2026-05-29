import { createMemo } from 'solid-js';
import { MS } from '../../primitives';
import { createUvIndexModel } from './outdoorModels';

export function UvIndexWidget(props) {
  const model = createMemo(() => createUvIndexModel(props.weather));

  return (
    <div
      class="uv-widget"
      classList={{ 'is-loading': model().isLoading }}
      style={{
        '--uv-accent':      model().theme.accent,
        '--uv-accent-soft': model().theme.soft,
        '--uv-ink':         model().theme.ink,
        '--uv-fill':        model().fill,
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
          <div class="uv-value t-num">{model().valueText}</div>
          <div class="uv-label">{model().label}</div>
          <div class="uv-peak">
            <span>Max</span>
            <strong>{model().maxTodayText}</strong>
          </div>
        </div>
      </div>

      <div class="uv-track-wrap" aria-hidden="true">
        <div class="uv-track">
          <span class="uv-track-marker"/>
        </div>
      </div>

      <div class="uv-advice">{model().advice}</div>
    </div>
  );
}
