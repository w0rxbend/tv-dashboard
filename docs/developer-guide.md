# Developer Guide

## Adding a New API Endpoint

Every route module follows the same four-section pattern. To add a new domain (e.g. `pollen`):

### 1. Create the route file

```typescript
// backend/src/routes/pollen.ts
import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { jitter } from '../lib/mock.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const PollenSchema = z.object({
  level: z.number().openapi({ example: 3, description: 'Pollen level 0–5' }),
  type:  z.string().openapi({ example: 'birch' }),
}).openapi('Pollen');

const PollenResponseSchema = z.object({
  data: PollenSchema,
}).openapi('PollenResponse');

// ─── Mock data provider ──────────────────────────────────────────────────────

function getPollenMock() {
  return { data: { level: Math.round(jitter(3, 1.5)), type: 'birch' } };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const getPollenRoute = createRoute({
  method: 'get', path: '/v1/pollen', tags: ['Pollen'],
  summary: 'Current pollen level',
  responses: {
    200: { content: { 'application/json': { schema: PollenResponseSchema } }, description: 'Pollen data' },
  },
});

export function registerPollenRoutes(app: OpenAPIHono) {
  app.openapi(getPollenRoute, (c) => c.json(getPollenMock()));
}
```

### 2. Register it in `app.ts`

```typescript
import { registerPollenRoutes } from './routes/pollen.js';
// ...
registerPollenRoutes(app);
```

### 3. Add the OpenAPI tag (optional but recommended)

```typescript
// app.ts — inside app.doc()
tags: [
  ...existingTags,
  { name: 'Pollen', description: 'Outdoor pollen index' },
]
```

The endpoint is now live, documented in Swagger UI, and type-safe end-to-end.

---

## Adding a New Dashboard Card

### 1. Create the API module

```js
// frontend/src/api/pollen.js
import { apiGet } from './client.js';
export const fetchPollen = () => apiGet('/v1/pollen');
```

### 2. Export from the API index

```js
// frontend/src/api/index.js
export { fetchPollen } from './pollen.js';

export const POLL = Object.freeze({
  ...existing,
  POLLEN: 300_000, // 5 min
});
```

### 3. Create the card component

```jsx
// frontend/src/components/PollenCard.jsx
import { createPolling } from '../data/createPolling';
import { fetchPollen, POLL } from '../api';

export default function PollenCard() {
  const pollen = createPolling(fetchPollen, { interval: POLL.POLLEN });
  const data   = () => pollen.latest;

  return (
    <article class="card card-lg" aria-label="Pollen">
      <div class="t-label-md muted">POLLEN</div>
      <span class="t-display-sm t-num">{data()?.level ?? '—'}</span>
      <span class="t-body-sm muted">{data()?.type ?? 'loading…'}</span>
    </article>
  );
}
```

### 4. Add to the grid

```jsx
// App.jsx
import PollenCard from './components/PollenCard';
// ...
<div class="area-pollen"><PollenCard/></div>
```

```css
/* styles/layout.css */
.area-pollen { grid-column: 10 / 13; grid-row: 3; }
```

---

## Replacing Mock Data with a Real API

The backend is designed for a clean mock → real swap. No frontend code changes required — just replace the mock function in the relevant route file.

### Example: real weather from Open-Meteo

```typescript
// backend/src/routes/weather.ts — replace getWeatherMock()

async function getWeatherLive(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,apparent_temperature,weather_code`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
    + `&forecast_days=7&timezone=Europe%2FStockholm`;

  const res  = await fetch(url);
  const body = await res.json();

  // Map Open-Meteo response → WeatherResponse shape
  return {
    data: {
      current: {
        temperature:     body.current.temperature_2m,
        feels_like:      body.current.apparent_temperature,
        // ...map remaining fields
      },
      forecast: body.daily.time.map((day: string, i: number) => ({
        day:          new Date(day).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        icon:         wmoToIcon(body.daily.weather_code[i]),
        weather_icon: wmoToWeatherIcon(body.daily.weather_code[i]),
        high:         body.daily.temperature_2m_max[i],
        low:          body.daily.temperature_2m_min[i],
      })),
    },
  };
}
```

The handler becomes:

```typescript
export function registerWeatherRoutes(app: OpenAPIHono) {
  app.openapi(getWeatherRoute, async (c) => {
    const data = await getWeatherLive(59.3147, 18.0699);
    return c.json(data);
  });
}
```

The response shape is validated by Zod at the route boundary — if the live API response doesn't match the schema, Hono returns a 500 automatically.

---

## Location Configuration

The location is currently hardcoded in `backend/src/routes/location.ts`. To make it configuration-driven:

### 1. Add environment variables

```bash
# backend/.env.example
LOCATION_CITY=Stockholm
LOCATION_REGION=Södermalm · SE
LOCATION_COUNTRY=SE
LOCATION_TIMEZONE=Europe/Stockholm
LOCATION_LATITUDE=59.3147
LOCATION_LONGITUDE=18.0699
```

### 2. Read in the route

```typescript
function getLocationMock() {
  return {
    data: {
      city:      process.env.LOCATION_CITY      ?? 'Stockholm',
      region:    process.env.LOCATION_REGION    ?? 'Södermalm · SE',
      country:   process.env.LOCATION_COUNTRY   ?? 'SE',
      timezone:  process.env.LOCATION_TIMEZONE  ?? 'Europe/Stockholm',
      latitude:  Number(process.env.LOCATION_LATITUDE  ?? 59.3147),
      longitude: Number(process.env.LOCATION_LONGITUDE ?? 18.0699),
    },
  };
}
```

### 3. Pass timezone to time-sensitive routes

Propagate `LOCATION_TIMEZONE` into `daylight.ts` and `events.ts` to replace the hardcoded `'Europe/Stockholm'` string.

---

## Customizing Design Tokens

All design tokens are in `frontend/src/styles/tokens.css` as CSS custom properties. To switch color palette:

```css
:root {
  /* Override primary accent */
  --md-primary:           #A8D5BA;
  --md-on-primary:        #003020;
  --md-primary-container: #1A4030;
  --md-on-primary-container: #C4EDD4;

  /* Override AQI good color */
  --md-good:           #6EC6A0;
  --md-good-container: #0F4028;
}
```

No JavaScript changes are needed — all card components read these properties directly.

---

## Mock Data Reference

### `jitter(base, amp)`

Returns `base ± amp` (uniform random, 2 decimal places).

```typescript
jitter(21.4, 0.3)  // → 21.1 … 21.7
jitter(54, 3)      // → 51 … 57
```

### `makeSeries(n, base, amp, seed)`

Deterministic pseudo-random walk of `n` points. Same `seed` always produces the same series shape.

```typescript
makeSeries(28, 8.2, 3, 9)
// → [8.41, 7.98, 9.12, ...] — always the same for seed=9
```

Use distinct seeds per metric to avoid correlated sparklines:

```typescript
sparklines: {
  pm25: makeSeries(28, 8.2, 3, 9),   // seed 9
  pm10: makeSeries(28, 14.6, 5, 15), // seed 15
  co2:  makeSeries(28, 612, 80, 27), // seed 27
  voc:  makeSeries(28, 0.42, 0.15, 31), // seed 31
}
```

### `rollSeries(series, base, amp)`

Produces a new array with the first element dropped and a new jittered value appended. Use this for a live rolling window effect if you persist state server-side.

---

## Scripts

```bash
# Root workspace
npm install     # installs @resvg/resvg-js (SVG rendering utility)

# Backend
npm run dev     # tsx watch — hot reload
npm run build   # tsc → dist/
npm start       # node dist/index.js

# Frontend
npm run dev     # Vite dev server (:5173, proxies /api → :3001)
npm run build   # Vite production build → dist/
npm run preview # Preview production build (:4173)
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| Frontend shows `—` on all cards | Is the backend running on `:3001`? Check `http://localhost:3001/api/health` |
| CORS errors in dev | Vite proxies `/api` — you should never see CORS errors in dev; if you do, check `vite.config.js` proxy target |
| Wrong time / active flags in production | The backend uses `Intl.DateTimeFormat` with `Europe/Stockholm` — ensure Node.js has ICU data (`node --icu-data-dir` or full-icu package) |
| Dashboard is cut off on display | Check that the `DESIGN_W`/`DESIGN_H` in `App.jsx` matches your target resolution |
| TypeScript errors on `tsx watch` | Run `cd backend && npm install` to ensure `tsx` and `typescript` are installed |
