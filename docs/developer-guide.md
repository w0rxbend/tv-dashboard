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

## Working with Real API Data

Weather and daylight use Open-Meteo through `backend/src/services/open-meteo.ts`; indoor telemetry uses the AirGradient observability backend through `backend/src/services/airgradient.ts`. Keep route handlers thin: validate/cache/fetch in a service, map upstream payloads with pure functions, then return the local response shape from the route.

### Example: mapping Open-Meteo weather

```typescript
// backend/src/services/weather-view.ts

export function mapWeatherView(raw: OpenMeteoWeatherResponse, location: WeatherLocationView) {
  return {
    current: {
      temperature: raw.current.temperature_2m,
      feels_like:  raw.current.apparent_temperature,
      location,
    },
    forecast: raw.daily.time.map((day, i) => ({
      day,
      high: Math.round(raw.daily.temperature_2m_max[i]),
      low:  Math.round(raw.daily.temperature_2m_min[i]),
    })),
  };
}
```

The handler becomes:

```typescript
export function registerWeatherRoutes(app: OpenAPIHono) {
  app.openapi(getWeatherRoute, async (c) => {
    const raw = await fetchWeatherFromAPI(config.location.latitude, config.location.longitude);
    return c.json({ data: mapWeatherView(raw, config.location) });
  });
}
```

Upstream payloads are validated with Zod inside the service. Failed upstream calls return the shared error envelope and, when possible, fall back to stale cached data.

---

## Location Configuration

The location is configuration-driven in `backend/src/config.ts` and returned by `GET /api/v1/location`.

```bash
# backend/.env.example
LOCATION_CITY=Kyiv
LOCATION_REGION=Kyiv · UA
LOCATION_COUNTRY=UA
LOCATION_TIMEZONE=Europe/Kyiv
LOCATION_LAT=50.4501
LOCATION_LON=30.5234
```

`PORT`, `LOCATION_TIMEZONE`, `LOCATION_LAT`, `LOCATION_LON`, `CORS_ORIGINS`, `OPEN_METEO_*`, `AIRGRADIENT_*`, and `GOOGLE_CALENDAR_*` timeout/cache settings are validated at startup so invalid runtime config fails fast.

---

## AirGradient Integration

`GET /api/v1/air-quality`, `GET /api/v1/air-quality/readings`, and `GET /api/v1/indoor-climate` read from the AirGradient observability backend:

```bash
AIRGRADIENT_API_BASE_URL=http://localhost:8080/api/
AIRGRADIENT_RANGE_WINDOW=12h
AIRGRADIENT_RANGE_STEP=15m
```

The adapter calls `/metrics/current` for the latest PM2.5, CO₂, TVOC, NOx, temperature, and humidity values, then calls `/metrics/range` for the PM2.5/CO₂/TVOC/NOx chart series. Responses are Zod-validated, cached briefly, and served stale if the AirGradient backend has a transient failure.

---

## Google Calendar Integration

`GET /api/v1/events` reads from Google Calendar. For a private calendar, create an OAuth web client, request the `https://www.googleapis.com/auth/calendar.readonly` scope, obtain a refresh token with offline access, then set:

```bash
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REFRESH_TOKEN=...
```

For a public calendar only, set `GOOGLE_CALENDAR_ID` and `GOOGLE_CALENDAR_API_KEY`. The backend asks Google for the configured day using local midnight boundaries from `LOCATION_TIMEZONE`, expands recurring events with `singleEvents=true`, orders by start time, and caches the mapped dashboard rows briefly. If neither OAuth credentials nor an API key are configured, `/api/v1/events` returns `503 calendar_not_configured`.

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

Use distinct seeds per metric to avoid correlated sparklines in mock-only routes:

```typescript
sparklines: {
  pm25: makeSeries(28, 8.2, 3, 9),   // seed 9
  co2:  makeSeries(28, 612, 80, 27), // seed 27
  voc:  makeSeries(28, 120, 25, 31), // seed 31
  nox:  makeSeries(28, 1, 0.5, 43), // seed 43
}
```

### `rollSeries(series, base, amp)`

Produces a new array with the first element dropped and a new jittered value appended. Use this for a live rolling window effect if you persist state server-side.

---

## Scripts

```bash
# Root workspace
npm install     # installs @resvg/resvg-js (SVG rendering utility)
npm run check   # format whitespace check + type/build validation + tests

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
| Wrong time / active flags in production | Check `LOCATION_TIMEZONE` is a valid IANA timezone and ensure Node.js has ICU data (`node --icu-data-dir` or full-icu package) |
| Dashboard is cut off on display | Check that the `DESIGN_W`/`DESIGN_H` in `App.jsx` matches your target resolution |
| TypeScript errors on `tsx watch` | Run `cd backend && npm install` to ensure `tsx` and `typescript` are installed |
