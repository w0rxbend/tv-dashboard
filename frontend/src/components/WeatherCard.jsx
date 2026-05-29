import { For } from 'solid-js';
import WeatherIcon from './WeatherIcon';
import { CardError } from '../primitives';
import { optionalResource } from '../data/emptyResource';

export default function WeatherCard(props) {
  const weather = optionalResource(props.weather);

  const current  = () => weather.latest?.current;
  const forecast = () => weather.latest?.forecast ?? [];

  return (
    <article class="card card-xl wx-card" aria-label="Current weather">
      <CardError error={weather.error}/>
      {/* Decorative blob */}
      <svg class="shape-blob" style={{ left: '-40px', bottom: '-80px', width: '260px', height: '260px' }} viewBox="0 0 200 200" aria-hidden="true">
        <path d="M 100 0 Q 200 50 180 130 Q 140 220 60 180 Q -20 130 20 50 Q 50 -30 100 0 Z" fill="#FFC857" opacity="0.4"/>
      </svg>

      {/* Current conditions */}
      <div class="wx-now">
        <div>
          <div class="t-label-md" style={{ opacity: 0.7 }}>
            OUTSIDE · {(current()?.location?.city ?? '—').toUpperCase()}
          </div>
          <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '6px', 'margin-top': '4px' }}>
            <span class="t-display-md t-num" style={{ 'font-weight': 300, 'letter-spacing': '-0.04em' }}>
              {current()?.temperature?.toFixed(1) ?? '—'}
            </span>
            <span class="t-title-lg" style={{ 'margin-top': '12px', opacity: 0.8 }}>°C</span>
          </div>
          <div class="t-body-lg" style={{ 'margin-top': '6px', opacity: 0.85 }}>
            {current()?.condition_label ?? 'Loading…'} · Feels {current()?.feels_like?.toFixed(1) ?? '—'}°
          </div>
          <div style={{ display: 'flex', gap: '8px', 'margin-top': '12px', 'flex-wrap': 'wrap' }}>
            <span class="chip" style={{ background: 'rgba(255,255,255,0.10)', color: 'inherit' }}>
              {current()?.wind_speed?.toFixed(0) ?? '—'} km/h {current()?.wind_direction ?? ''}
            </span>
            <span class="chip" style={{ background: 'rgba(255,255,255,0.10)', color: 'inherit' }}>
              {current()?.humidity?.toFixed(0) ?? '—'}%
            </span>
            <span class="chip" style={{ background: 'rgba(255,255,255,0.10)', color: 'inherit' }}>
              UV {current()?.uv_index ?? '—'}
            </span>
          </div>
        </div>

        {/* Composite animated weather icon */}
        <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
          <WeatherIcon condition={current()?.weather_icon ?? 'cloudy'} size={152}/>
        </div>
      </div>

      {/* 7-day forecast — small composite icons per day */}
      <div class="wx-forecast" role="list" aria-label="7-day forecast">
        <For each={forecast()}>
          {(f, i) => (
            <div classList={{ 'wx-fcell': true, today: i() === 0 }} role="listitem">
              <span class="t-label-md" style={{ opacity: i() === 0 ? 1 : 0.7, 'font-size': '11px' }}>{f.day}</span>
              <WeatherIcon condition={f.weather_icon ?? 'cloudy'} size={36}/>
              <span class="t-title-md t-num">{f.high}°</span>
              <span class="t-body-sm" style={{ opacity: 0.6 }}>{f.low}°</span>
            </div>
          )}
        </For>
      </div>
    </article>
  );
}
