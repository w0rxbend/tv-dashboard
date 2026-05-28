import { MS, Sparkline, LinearTrack, CardError } from '../primitives';
import { createPolling } from '../data/createPolling';
import { fetchIndoorClimate, POLL } from '../api';

const TEMP_MIN_C = 18;
const TEMP_MAX_C = 26;

export default function IndoorCard() {
  const climate = createPolling(fetchIndoorClimate, { interval: POLL.INDOOR_CLIMATE });

  const data    = () => climate.latest;
  const tempPct = () => data()
    ? Math.max(0, Math.min(100, ((data().temperature - TEMP_MIN_C) / (TEMP_MAX_C - TEMP_MIN_C)) * 100))
    : 0;
  const sparks  = () => data()?.sparklines;

  return (
    <article class="card card-lg indoor-card" aria-label="Indoor climate">
      <CardError error={climate.error}/>
      <div>
        <div class="t-label-md muted">
          {(data()?.sensor_location ?? 'LIVING ROOM').toUpperCase()} · SENSOR ARRAY
        </div>
        <div class="t-title-lg">Indoor climate</div>
      </div>

      <div class="indoor-grid">
        <div class="indoor-cell">
          <MS name="thermostat" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">Temperature</span>
          <span><span class="v t-num">{data()?.temperature?.toFixed(1) ?? '—'}</span><span class="u">°C</span></span>
          <LinearTrack value={tempPct()} color="#FFB59A"/>
        </div>

        <div class="indoor-cell">
          <MS name="humidity_percentage" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">Humidity</span>
          <span><span class="v t-num">{data()?.humidity ? Math.round(data().humidity) : '—'}</span><span class="u">%</span></span>
          <LinearTrack value={data()?.humidity ?? 0} color="#82DBA6"/>
        </div>

        <div class="indoor-cell">
          <MS name="co2" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">CO₂</span>
          <span><span class="v t-num">{data()?.co2 ?? '—'}</span><span class="u">ppm</span></span>
          {sparks() && <Sparkline data={sparks().co2} width={140} height={22} color="#82DBA6"/>}
        </div>

        <div class="indoor-cell">
          <MS name="science" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">tVOC</span>
          <span><span class="v t-num">{data()?.voc?.toFixed(2) ?? '—'}</span><span class="u">mg/m³</span></span>
          {sparks() && <Sparkline data={sparks().voc} width={140} height={22} color="#D0BCFF"/>}
        </div>
      </div>
    </article>
  );
}
