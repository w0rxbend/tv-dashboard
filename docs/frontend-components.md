# Frontend Components

All components live in `frontend/src/`. The frontend is written in plain JavaScript with JSX (SolidJS). There are no TypeScript types — the API contract is enforced by the backend's Zod schemas.

---

## Layout

### `App.jsx` — Root

Mounts all seven cards into a fixed 1920×1080 stage that scales to fill any viewport.

```jsx
<div class="stage-wrap">          // fills viewport, overflow hidden
  <div class="stage"              // 1920×1080, transform: scale(x, y)
       style={{ transform }}>
    <Background/>                 // three animated ambient blobs (aria-hidden)
    <div class="dash">            // 12-col × 4-row CSS grid
      <div class="area-topbar">   <TopBar/>     </div>
      <div class="area-aqi">      <AQICard/>    </div>
      <div class="area-wx">       <WeatherCard/></div>
      <div class="area-agenda">   <AgendaCard/> </div>
      <div class="area-chart">    <ChartCard/>  </div>
      <div class="area-indoor">   <IndoorCard/> </div>
      <div class="area-bottom">   <BottomStrip/></div>
    </div>
  </div>
</div>
```

The scale factors are updated on every `resize` event. `onCleanup` removes the listener.

---

## Cards

### `TopBar` — `components/TopBar.jsx`

**Data:** `fetchLocation` (once), `fetchDevices` (every 1 min), `useNow` (every 1 s)

Renders:
- **Brand** — Aurora logo + wordmark
- **Clock** — live HH:MM with animated seconds
- **Status chips** — location label, sensor mesh summary

```jsx
// Mesh status logic
const meshOnline = () => devices.latest?.online === devices.latest?.total;
const meshLabel  = () => `Mesh synced · ${d.online}/${d.total} sensors`;
```

The clock uses `useNow(1000)` which is a SolidJS signal updated every second — no re-render of the entire component, just the `<time>` node.

---

### `AQICard` — `components/AQICard.jsx`

**Data:** `fetchAirQuality` (every 10 s)

The largest card (columns 1–5, row 2). Contains:

| Sub-element | Description |
|---|---|
| `RadialGauge` | 270° arc gauge, 0–200 AQI range, color from `category.color` |
| Category chip | Name + colored dot, container color from `category.container` |
| Metric rows | PM2.5 · PM10 · CO₂ · tVOC with value, unit, and `Sparkline` |
| Decorative blob | SVG shape colored with `category.color` at 35% opacity |

The `cat()` accessor always has a fallback so the gauge renders immediately with a neutral blue before the first poll resolves:

```js
const cat = () => data()?.category ?? {
  color: '#B4C5FF',
  container: 'var(--md-primary-container)',
  on: 'var(--md-on-primary-container)',
  name: '…',
};
```

---

### `WeatherCard` — `components/WeatherCard.jsx`

**Data:** `fetchWeather` (every 10 min)

Renders:
- Location label + large temperature
- Condition label + feels-like
- Wind · Humidity · UV chips
- Animated `WeatherIcon` (152 px)
- 7-day forecast strip with small `WeatherIcon` per day (36 px) + high/low temps

The `forecast` accessor defaults to `[]` so the `<For>` loop renders an empty row safely while data loads.

---

### `AgendaCard` — `components/AgendaCard.jsx`

**Data:** `fetchEvents` (every 10 min), `fetchDaylight` (every 24 h), `useNow` (every 60 s)

Spans rows 2–3 (the full right column). Contains:
- Day / date header + event count
- `SunArc` SVG visualization (sunrise → sunset arc with animated puck)
- Event list — each row highlights with `.active` class when `event.active === true`

The agenda clock (`useNow(60_000)`) updates once per minute — sufficient for the date header; the active-flag truth comes from the server, not the client clock.

---

### `ChartCard` — `components/ChartCard.jsx`

**Data:** `fetchAirQualityReadings` (every 10 s)

Full-width telemetry chart (columns 1–6, row 3). Contains:
- `LineChart` with four series: PM0.3 (blue), PM1 (green), PM2.5 (peach), PM10 (yellow)
- Color-coded legend
- Summary stats: peak PM2.5, peak PM10, avg PM1, avg PM0.3

```js
const PM_SERIES = [
  { id: 'pm03', label: 'PM0.3', color: '#B4C5FF' },
  { id: 'pm1',  label: 'PM1',   color: '#82DBA6' },
  { id: 'pm25', label: 'PM2.5', color: '#FFB59A' },
  { id: 'pm10', label: 'PM10',  color: '#FFD68A' },
];
```

---

### `IndoorCard` — `components/IndoorCard.jsx`

**Data:** `fetchIndoorClimate` (every 1 min)

Four-cell grid showing temperature, humidity, CO₂, and tVOC:

| Metric | Visual | Range |
|---|---|---|
| Temperature | `LinearTrack` | 18–26 °C mapped to 0–100% |
| Humidity | `LinearTrack` | direct % value |
| CO₂ | `Sparkline` | ppm |
| tVOC | `Sparkline` | mg/m³ |

Temperature percentage: `((temp - 18) / 8) * 100` maps 18 °C → 0%, 26 °C → 100%.

---

### `BottomStrip` — `components/BottomStrip.jsx`

**Data:** `fetchInsights` (5 min), `fetchReminders` (10 min), `fetchDevices` (1 min), `fetchWeather` (10 min)

Five equal-width cells:

| Cell | Content |
|---|---|
| Aurora Insight | Rotates through all insights every 6 s; progress dot indicator |
| Reminders | First 3 reminders; done items struck-through |
| Device Mesh | `online/total` count + average latency |
| Wind | Speed + direction + condition label |
| UV Index | Index number + WHO label + advice string |

The insight rotation uses a `setInterval` managed via `onMount`/`onCleanup`.

---

## Primitives

Reusable SVG/DOM atoms in `frontend/src/primitives/`.

### `MS` — Material Symbols icon

```jsx
<MS name="thermostat" size={24} fill />
```

Renders a Material Symbols ligature span. `fill` prop toggles the filled variant via `font-variation-settings`.

---

### `Sparkline` — `primitives/Sparkline.jsx`

```jsx
<Sparkline data={[7.1, 8.4, ...]} width={140} height={26} color="#FFB59A" />
```

Minimal SVG polyline over a data array. Auto-scales Y to the min/max of the data. No axes, no labels — purely decorative trend visualization.

---

### `LineChart` — `primitives/LineChart.jsx`

```jsx
<LineChart
  width={820} height={120}
  padding={{ t: 8, r: 8, b: 22, l: 32 }}
  series={[
    { data: pm03Series, color: '#B4C5FF' },
    ...
  ]}
/>
```

Multi-series SVG line chart with a Y-axis (left) and X time labels (bottom). Each series is an independent `<polyline>`. Scales to a shared Y domain across all series.

---

### `RadialGauge` — `primitives/RadialGauge.jsx`

```jsx
<RadialGauge value={42} max={200} size={320} color="#82DBA6" />
```

270° circular progress arc with 31 tick marks. Animated fill via `stroke-dashoffset` transition (`1.4s var(--ease-emphasized)`). Geometry is memoized — only recomputes when `size` changes.

Props:

| Prop | Default | Description |
|---|---|---|
| `value` | required | Current value |
| `max` | `300` | Maximum value |
| `size` | `280` | SVG width/height in px |
| `color` | `#B4C5FF` | Fill and glow color |
| `track` | `rgba(255,255,255,0.10)` | Background arc color |

---

### `SunArc` — `primitives/SunArc.jsx`

```jsx
<SunArc
  progress={0.62}
  sunrise="05:24"
  sunset="21:42"
  width={360}
  height={112}
/>
```

Elliptical arc from sunrise (left) to sunset (right) with an animated sun puck at the current progress position. The elapsed portion uses a three-stop gradient (peach → amber → green). Includes an accessible `role="img"` with `aria-label` describing the sun position.

Progress mapping: `0` = sunrise position, `0.5` = zenith, `1` = sunset.

---

### `LinearTrack` — `primitives/LinearTrack.jsx`

```jsx
<LinearTrack value={72} color="#FFB59A" />
```

Full-width horizontal progress bar. `value` is 0–100.

---

## Data Utilities

### `createPolling(fetcher, { interval })` — `data/createPolling.js`

```js
const weather = createPolling(fetchWeather, { interval: POLL.WEATHER });
// weather.latest — previous successful value (never flashes empty)
// weather()      — current value (undefined while loading)
// weather.loading, weather.error — resource state
```

Must be called inside a SolidJS reactive owner (component body or `runWithOwner`). Cleans up the interval in `onCleanup`.

---

### `useNow(intervalMs)` — `data/hooks.js`

Returns a `() => Date` signal updated every `intervalMs` ms. Default: 1000.

### `useDrift(start, opts)` — `data/hooks.js`

Returns a numeric signal that slowly random-walks within `[min, max]`. Useful for simulating a live sensor reading without API calls.

```js
const temp = useDrift(21.4, { min: 18, max: 26, step: 0.3, ms: 1500 });
```

### `useStream(initial, opts)` — `data/hooks.js`

Returns a `number[]` signal. On each tick, drops the first element and appends a new jittered value. Simulates a streaming chart feed.

```js
const co2Stream = useStream(sparklineData, { ms: 1500, jitter: 15, min: 400, max: 1200 });
```

---

## Styling Conventions

| Class prefix | Meaning |
|---|---|
| `t-display-*` | Large display text (MD3 Display scale) |
| `t-headline-*` | Headline text |
| `t-title-*` | Title text |
| `t-body-*` | Body text |
| `t-label-*` | Label text (caps, tight) |
| `t-num` | Tabular numeric font (Roboto Mono) |
| `t-mono` | Monospace |
| `muted` | `opacity: 0.7` secondary text |
| `chip` | Pill-shaped token/badge |
| `chip-good` | Green status chip |
| `chip-outline` | Outlined chip (location) |
| `card` | Base glassmorphic card surface |
| `card-xl` | Extra-large card variant |
| `card-lg` | Large card variant |
| `lbl` + `v` + `u` | Metric label / value / unit triplet |
