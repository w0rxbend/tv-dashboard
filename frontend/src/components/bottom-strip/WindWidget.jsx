import { createMemo } from 'solid-js';
import { MS } from '../../primitives';
import { createWindModel } from './outdoorModels';

export function WindWidget(props) {
  const model = createMemo(() => createWindModel(props.weather));

  return (
    <div
      class="wind-widget"
      classList={{ 'is-loading': model().isLoading }}
      style={{
        '--wind-accent':   model().theme.accent,
        '--wind-ink':      model().theme.ink,
        '--wind-soft':     model().theme.soft,
        '--wind-angle':    `${model().bearing}deg`,
        '--wind-strength': model().strength,
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
            <div class="wind-speed t-num">{model().speedText}</div>
            <div class="wind-unit">km/h</div>
          </div>
        </div>

        <div class="wind-readout">
          <div class="wind-label">{model().label}</div>
          <div class="wind-stat">
            <span>From</span>
            <strong>{model().direction}</strong>
          </div>
          <div class="wind-stat">
            <span>Gust</span>
            <strong>{model().gustText} <small>km/h</small></strong>
          </div>
        </div>
      </div>

      <div class="wind-meter" aria-hidden="true">
        <span/>
      </div>

      <div class="wind-advice">{model().advice}</div>
    </div>
  );
}
