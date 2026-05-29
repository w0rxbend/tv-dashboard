import { MS, Sparkline, LinearTrack, CardError } from '../primitives';
import { optionalResource } from '../data/emptyResource';

const TEMP_MIN_C = 18;
const TEMP_MAX_C = 26;

export default function IndoorCard(props) {
  const indoorClimate = optionalResource(props.indoorClimate);

  const data    = () => indoorClimate.latest;
  const tempPct = () => data()
    ? Math.max(0, Math.min(100, ((data().temperature - TEMP_MIN_C) / (TEMP_MAX_C - TEMP_MIN_C)) * 100))
    : 0;
  const sparklines = () => data()?.sparklines;

  return (
    <article class="card card-lg indoor-card" aria-label="Indoor climate">
      <CardError error={indoorClimate.error}/>
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
          <LinearTrack
            value={tempPct()}
            color="#FFB59A"
            label="Temperature comfort range"
            valueText={data()?.temperature == null ? 'Temperature unavailable' : `${data().temperature.toFixed(1)} degrees Celsius`}
          />
        </div>

        <div class="indoor-cell">
          <MS name="humidity_percentage" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">Humidity</span>
          <span><span class="v t-num">{data()?.humidity ? Math.round(data().humidity) : '—'}</span><span class="u">%</span></span>
          <LinearTrack
            value={data()?.humidity ?? 0}
            color="#82DBA6"
            label="Humidity"
            valueText={data()?.humidity == null ? 'Humidity unavailable' : `${Math.round(data().humidity)} percent`}
          />
        </div>

        <div class="indoor-cell">
          <MS name="co2" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">CO₂</span>
          <span><span class="v t-num">{data()?.co2 ?? '—'}</span><span class="u">ppm</span></span>
          {sparklines() && <Sparkline data={sparklines().co2} width={140} height={22} color="#82DBA6"/>}
        </div>

        <div class="indoor-cell">
          <MS name="science" class="indoor-cell-icon" aria-hidden="true"/>
          <span class="lbl">tVOC</span>
          <span><span class="v t-num">{data()?.voc ?? '—'}</span><span class="u">index</span></span>
          {sparklines() && <Sparkline data={sparklines().voc} width={140} height={22} color="#D0BCFF"/>}
        </div>
      </div>
    </article>
  );
}
