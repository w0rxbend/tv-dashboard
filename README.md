# Aurora TV Dashboard

A full-screen ambient home dashboard designed for 1920×1080 TV displays. Built with **SolidJS** and a **Hono** BFF (backend-for-frontend) that serves live Open-Meteo weather/air-quality data plus local dashboard data over a typed REST API.

```
frontend/   SolidJS + Vite — renders the pixel-perfect 7-card layout
backend/    Hono + Zod/OpenAPI — REST endpoints, Swagger UI built-in
```

---

## Features

| Card | Data Domain | Refresh |
|---|---|---|
| TopBar | Clock · Location · Sensor mesh | 1 s clock, 1 min devices |
| AQI Hero | US AQI, PM2.5/PM10, CO₂, VOC + sparklines | 10 s |
| Weather | Current conditions + 7-day forecast | 10 min |
| Agenda | Today's calendar, sunrise/sunset arc | 10 min / 24 h |
| Telemetry Chart | 48-point PM0.3/PM1/PM2.5/PM10 history | 10 s |
| Indoor Climate | Temperature, humidity, CO₂, VOC + sparklines | 1 min |
| Bottom Strip | Insights · Reminders · Devices · Wind · UV | 5–10 min |

The display is **design-fixed at 1920×1080** and scaled independently on each axis with `transform: scale(sx, sy)`, so it renders correctly on any screen size without reflowing.

---

## Quick Start

### Prerequisites

- Node.js 20+
- Two terminal sessions (or a process manager)

### 1 — Start the backend

```bash
cd backend
npm install
npm run dev          # tsx watch — hot-reloads on save
# → http://localhost:3001/api/health
# → http://localhost:3001/api/docs   (Swagger UI)
```

### 2 — Start the frontend

```bash
cd frontend
npm install
npm run dev          # Vite dev server + /api proxy
# → http://localhost:5173
```

Open a browser (or a Chromium kiosk session) at `http://localhost:5173`.

### Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

For production you typically serve `frontend/dist/` as static files from the same origin as the backend, so no CORS configuration is needed.

### Quality gate

```bash
npm run check
```

The root check runs formatting whitespace validation, backend typechecking, frontend build validation, and the backend/frontend test suites.

---

## Project Structure

```
tv-dashboard/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Hono app — CORS, route registration, OpenAPI spec
│   │   ├── index.ts            # Node server entry point (PORT env var)
│   │   ├── lib/
│   │   │   └── mock.ts         # Shared PRNG utilities (jitter, makeSeries, rollSeries)
│   │   └── routes/
│   │       ├── air-quality.ts  # GET /v1/air-quality, GET /v1/air-quality/readings
│   │       ├── daylight.ts     # GET /v1/daylight
│   │       ├── devices.ts      # GET /v1/devices
│   │       ├── energy.ts       # GET /v1/energy
│   │       ├── events.ts       # GET /v1/events
│   │       ├── indoor-climate.ts
│   │       ├── insights.ts
│   │       ├── location.ts
│   │       ├── reminders.ts
│   │       └── weather.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root — viewport scaling + grid mount
│   │   ├── index.jsx           # SolidJS render entry
│   │   ├── api/                # One file per domain; apiGet() client
│   │   │   ├── client.js       # Fetch wrapper with timeout + abort + error types
│   │   │   └── index.js        # Re-exports + POLL constants
│   │   ├── components/         # Seven card components + AppLogo + WeatherIcon
│   │   ├── data/               # createPolling, useNow, useDrift, useStream, seed
│   │   ├── primitives/         # SVG UI atoms (Sparkline, LineChart, RadialGauge, …)
│   │   └── styles/             # CSS custom properties + layout + typography
│   ├── index.html
│   └── vite.config.js          # solidPlugin + /api proxy → :3001
│
└── package.json                # Root workspace (devDependencies only)
```

---

## Environment Variables

| Variable | Location | Default | Description |
|---|---|---|---|
| `PORT` | backend | `3001` | Hono server port |
| `CORS_ORIGINS` | backend | `http://localhost:5173,http://localhost:4173` | Comma-separated origins allowed by the backend |
| `LOCATION_CITY` | backend | `Kyiv` | Display city returned by `/api/v1/location` |
| `LOCATION_REGION` | backend | `Kyiv · UA` | Display region returned by `/api/v1/location` |
| `LOCATION_COUNTRY` | backend | `UA` | Country code returned by `/api/v1/location` |
| `LOCATION_TIMEZONE` | backend | `Europe/Kyiv` | IANA timezone used by time-aware routes |
| `LOCATION_LAT` | backend | `50.4501` | Latitude used for Open-Meteo requests |
| `LOCATION_LON` | backend | `30.5234` | Longitude used for Open-Meteo requests |
| `OPEN_METEO_TIMEOUT_MS` | backend | `8000` | Upstream request timeout |
| `OPEN_METEO_RETRIES` | backend | `1` | Retry count for retryable Open-Meteo failures |
| `OPEN_METEO_RETRY_BACKOFF_MS` | backend | `100` | Initial retry backoff in milliseconds |
| `OPEN_METEO_WEATHER_TTL_MS` | backend | `900000` | Fresh-cache TTL for weather responses |
| `OPEN_METEO_AIR_QUALITY_TTL_MS` | backend | `1800000` | Fresh-cache TTL for air-quality responses |
| `OPEN_METEO_STALE_FALLBACK_MS` | backend | `7200000` | Stale cache window used when upstream refresh fails |
| `VITE_API_BASE` | frontend | `/api` | Base path for all API calls |

Create `backend/.env` or pass vars inline — there is no `.env` file committed.

---

## API at a Glance

All endpoints live under `/api/v1/`. The backend auto-generates a full OpenAPI 3.1 spec and Swagger UI:

- **Swagger UI** → `http://localhost:3001/api/docs`
- **OpenAPI JSON** → `http://localhost:3001/api/openapi.json`
- **Health check** → `http://localhost:3001/api/health`

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/location` | Location config (city, timezone, lat/lng) |
| GET | `/api/v1/weather` | Current conditions + 7-day forecast |
| GET | `/api/v1/air-quality` | AQI, PM2.5/PM10, CO₂, VOC + sparklines |
| GET | `/api/v1/air-quality/readings` | 48-point 12-h PM channel history |
| GET | `/api/v1/indoor-climate` | Indoor temp, humidity, CO₂, VOC |
| GET | `/api/v1/events?date=` | Calendar events for a date |
| GET | `/api/v1/reminders` | Reminder list |
| GET | `/api/v1/daylight` | Sunrise, sunset, progress, day length |
| GET | `/api/v1/insights` | AI-generated home environment insights |
| GET | `/api/v1/devices` | Sensor mesh online status + latency |
| GET | `/api/v1/energy` | Consumption, solar generation, grid import |

See [docs/api-reference.md](docs/api-reference.md) for full request/response shapes.

---

## Recommended Polling Intervals

Defined in `frontend/src/api/index.js` as `POLL`:

```js
POLL.AIR_QUALITY    = 10_000    // 10 s  — sensor telemetry changes rapidly
POLL.ENERGY         = 30_000    // 30 s
POLL.INDOOR_CLIMATE = 60_000    // 1 min
POLL.DEVICES        = 60_000    // 1 min
POLL.INSIGHTS       = 300_000   // 5 min
POLL.WEATHER        = 600_000   // 10 min
POLL.EVENTS         = 600_000   // 10 min
POLL.REMINDERS      = 600_000   // 10 min
POLL.DAYLIGHT       = 86_400_000 // 24 h — sun times don't change intra-day
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | [SolidJS](https://www.solidjs.com/) 1.9 |
| Frontend build | Vite 5 + vite-plugin-solid |
| Animation | GSAP 3.15 |
| Backend framework | [Hono](https://hono.dev/) 4.7 |
| API schema | [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) + Zod 4 |
| API docs | @hono/swagger-ui |
| Runtime | Node.js via @hono/node-server |
| TypeScript | 5.7 (backend only; frontend is plain JS) |
| Design system | Material Design 3 Expressive — dark theme |

---

## Further Reading

- [Architecture](docs/architecture.md) — system diagram, data flow, grid layout
- [API Reference](docs/api-reference.md) — all endpoints with request/response schemas
- [Frontend Components](docs/frontend-components.md) — cards and UI primitives
- [Developer Guide](docs/developer-guide.md) — adding endpoints, cards, real data sources
