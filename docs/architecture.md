# Architecture

## System Overview

Aurora is a **single-display ambient dashboard**. The architecture is intentionally minimal: one Hono server, one SolidJS SPA, no database, no authentication, no build-time data fetching.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser / Kiosk (1920×1080)                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SolidJS SPA  (frontend/src)                            │   │
│  │                                                         │   │
│  │  App.jsx  ─── 12-col × 4-row CSS Grid ─────────────┐   │   │
│  │                                                     │   │   │
│  │  TopBar  AQICard  WeatherCard  AgendaCard           │   │   │
│  │  ChartCard  IndoorCard  BottomStrip                 │   │   │
│  │                                                     │   │   │
│  │  createPolling() ──► apiGet() ──► /api/*            │   │   │
│  └─────────────────────────────────────────────────────┘   │   │
│                        │ HTTP (proxied in dev)               │   │
└────────────────────────┼────────────────────────────────────┘   │
                         │                                         
┌────────────────────────┼─────────────────────────────────────┐  
│  Hono BFF  (backend/src)                                     │  
│                        │                                     │  
│  app.ts  ──── /api ────┤                                     │  
│                        ├── /v1/weather                       │  
│                        ├── /v1/air-quality                   │  
│                        ├── /v1/air-quality/readings          │  
│                        ├── /v1/indoor-climate                │  
│                        ├── /v1/daylight                      │  
│                        ├── /v1/events                        │  
│                        ├── /v1/reminders                     │  
│                        ├── /v1/insights                      │  
│                        ├── /v1/devices                       │  
│                        ├── /v1/energy                        │  
│                        ├── /v1/location                      │  
│                        ├── /openapi.json                     │  
│                        └── /docs  (Swagger UI)               │  
└──────────────────────────────────────────────────────────────┘  
```

---

## Frontend Architecture

### Viewport Scaling

The entire dashboard is drawn at a **fixed 1920×1080 canvas** and then scaled to fill whatever screen is attached:

```js
// App.jsx
const DESIGN_W = 1920;
const DESIGN_H = 1080;

const scale = () => ({
  x: window.innerWidth  / DESIGN_W,
  y: window.innerHeight / DESIGN_H,
});

// CSS: transform: scale(scale.x, scale.y) from top-left
```

Independent X/Y scaling means the layout is always pixel-perfect to the design intent — no reflow, no media queries.

### 12-Column CSS Grid

```
Row 1 (92 px)   [ TopBar ─────────────────────────────────── ]
Row 2 (388 px)  [ AQI Hero ──────── ][ Weather ][ Agenda     ]
Row 3 (280 px)  [ Chart ─────────── ][ Indoor  ][ Agenda cont]
Row 4 (232 px)  [ Bottom Strip ──────────────────────────── ]
```

```css
.dash {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: 92px 388px 280px 232px;
  gap: 18px;
  padding: 24px 28px;
}

.area-aqi    { grid-column: 1 / 6;   grid-row: 2;     }
.area-wx     { grid-column: 6 / 10;  grid-row: 2;     }
.area-agenda { grid-column: 10 / 13; grid-row: 2 / 4; } /* spans rows 2–3 */
.area-chart  { grid-column: 1 / 7;   grid-row: 3;     }
.area-indoor { grid-column: 7 / 10;  grid-row: 3;     }
```

### Data Layer

```
┌─ createPolling(fetcher, { interval }) ─────────────────────────┐
│  SolidJS createResource(fetcher)                               │
│  setInterval(refetch, interval)  ──► re-fetches in background  │
│  resource.latest  ──► previous value shown while refreshing    │
└────────────────────────────────────────────────────────────────┘
```

`resource.latest` (not `resource()`) is used in templates so the card never flashes blank between polls.

#### Reactive hooks (`data/hooks.js`)

| Hook | Purpose |
|---|---|
| `useNow(ms)` | Live `Date` signal, updates every `ms` |
| `useDrift(start, opts)` | Slowly random-walking numeric signal (simulated sensor) |
| `useStream(initial, opts)` | Rolling time-series — drops oldest, appends newest each tick |

### API Client (`api/client.js`)

```
apiGet(path, opts?)
  ├── AbortController (timeout)
  ├── opts.signal linked (with removeEventListener cleanup in finally)
  ├── fetch → JSON → unwrap body.data
  ├── non-2xx → ApiError(status, code, message)
  ├── AbortError (timed out) → ApiError(0, 'timeout', …)
  ├── AbortError (caller signal) → ApiError(0, 'cancelled', …)
  └── network failure → ApiError(0, 'network_error', …)
```

Default timeout: 10 000 ms. Pass `opts.timeout` to override.

---

## Backend Architecture

### Stack

```
@hono/node-server  ──► Hono v4 (OpenAPIHono)
                           ├── cors middleware (localhost dev)
                           ├── 10× domain route modules
                           ├── /openapi.json  (auto-generated)
                           └── /docs  (Swagger UI)
```

### Route Module Pattern

Every route module follows the same four-section structure:

```typescript
// 1. Zod schemas (define the OpenAPI shape + TypeScript types)
const FooSchema = z.object({ ... }).openapi('Foo');

// 2. Mock data provider (pure function, no side effects)
function getFooMock(): z.infer<typeof FooResponseSchema> { ... }

// 3. Route definition (method, path, tags, responses)
const getFooRoute = createRoute({ ... });

// 4. Registration (exported, called from app.ts)
export function registerFooRoutes(app: OpenAPIHono) {
  app.openapi(getFooRoute, (c) => c.json(getFooMock()));
}
```

### Mock Data Utilities (`lib/mock.ts`)

| Function | Signature | Purpose |
|---|---|---|
| `jitter(base, amp)` | `(number, number) → number` | Random float ±amp around base, 2dp |
| `jitterInt(base, amp)` | `(number, number) → number` | Same, rounded to integer |
| `makeSeries(n, base, amp, seed)` | `→ number[]` | Deterministic pseudo-random walk (same seed → same shape) |
| `rollSeries(series, base, amp)` | `→ number[]` | Drop first, append new jittered point |

`makeSeries` uses the LCG `s = (s × 9301 + 49297) mod 233280`. Values are clamped to `[base×0.4, base×1.7]`.

### Timezone Handling

All time-relative mock data uses **Stockholm local time** via `Intl.DateTimeFormat` with `timeZone: 'Europe/Stockholm'`. This means the backend can run in any timezone (including UTC) and still return correct dates, progress values, and event active flags.

```typescript
// daylight.ts + events.ts pattern
const parts = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).formatToParts(new Date());
```

---

## Data Flow Sequence

```
Browser loads → SolidJS mounts components
                   │
                   ├─► createPolling(fetch*, { interval }) ──► initial fetch
                   │         │                                     │
                   │         └── setInterval ──────────────────────┤
                   │                                               │
                   └─► createResource(fetchLocation)               │
                                                                   ▼
                                               GET /api/v1/<domain>
                                                         │
                                             Hono route handler
                                                         │
                                             getMock() → JSON
                                                         │
                                             { data: { ... } }
                                                         │
                                             apiGet() unwraps body.data
                                                         │
                                             resource.latest updates
                                                         │
                                             SolidJS reactivity → DOM update
```

---

## Design System

Aurora uses **Material Design 3 Expressive** in a custom dark theme, implemented as CSS custom properties in `frontend/src/styles/tokens.css`.

### Color Roles

| Token | Value | Usage |
|---|---|---|
| `--md-surface` | `#131318` | Card backgrounds |
| `--md-on-surface` | `#E6E0E9` | Primary text |
| `--md-primary` | `#B4C5FF` | Cool blue accent |
| `--md-tertiary` | `#FFB59A` | Warm peach accent |
| `--md-good` | `#82DBA6` | Good AQI, online status |
| `--md-warn` | `#FFD68A` | Moderate AQI, caution |
| `--md-bad` | `#FFB4AB` | Unhealthy/hazardous AQI |
| `--md-violet` | `#D0BCFF` | VOC, secondary data |

### Shape Scale

```css
--shape-xs:   12px   --shape-sm:  16px   --shape-md: 20px
--shape-lg:   28px   --shape-xl:  36px   --shape-2xl: 44px
--shape-pill: 9999px
```

### Typography

- **Display / Headline / Title / Body / Label** — Roboto Flex (variable weight 100–900)
- **Monospace numbers** — Roboto Mono (tabular figures, `t-num` class)

### Ambient Background

Three layered CSS radial-gradient blobs drift with `animation: drift 22s ease-in-out infinite alternate`, rendered outside the card grid with `aria-hidden="true"`.
