# API Reference

All endpoints are served under the base path `/api`. Every response wraps its payload in a `{ "data": { ... } }` envelope.

Interactive documentation is available at **`http://localhost:3001/api/docs`** (Swagger UI) and the raw OpenAPI 3.1 spec at **`http://localhost:3001/api/openapi.json`**.

---

## Response Envelope

```json
{
  "data": { ...domain-specific payload... }
}
```

---

## Error Shape

Non-2xx responses and handled errors use:

```json
{
  "error": {
    "code":    "string",
    "message": "string",
    "details": [],
    "requestId": "optional-string"
  }
}
```

### Client-side error codes (`ApiError.code`)

| Code | Meaning |
|---|---|
| `http_error` | Server returned 4xx/5xx with no structured error body |
| `timeout` | Request exceeded the 10 s default timeout |
| `cancelled` | Caller aborted the request via `opts.signal` |
| `network_error` | Fetch failed (DNS, connection refused, etc.) |
| `bad_response` | 2xx response with no `data` key in the JSON body |

---

## Endpoints

### GET `/api/v1/location`

Returns the static location configuration. Changes very rarely; suitable for once-per-session fetching.

**Response**

```json
{
  "data": {
    "city":      "Kyiv",
    "region":    "Kyiv · UA",
    "country":   "UA",
    "timezone":  "Europe/Kyiv",
    "latitude":  50.4501,
    "longitude": 30.5234
  }
}
```

---

### GET `/api/v1/weather`

Current outdoor conditions and a 7-day forecast.

**Response**

```json
{
  "data": {
    "current": {
      "temperature":     19.4,
      "feels_like":      18.2,
      "condition":       "partly_cloudy",
      "condition_label": "Partly cloudy",
      "icon":            "partly_cloudy_day",
      "weather_icon":    "partly_cloudy",
      "wind_speed":      8.0,
      "wind_degrees":    45,
      "wind_direction":  "NE",
      "wind_gust":       18.0,
      "wind_level":      "light",
      "wind_label":      "Light",
      "wind_advice":     "Light breeze",
      "humidity":        54,
      "uv_index":        4,
      "uv_max_today":    5,
      "uv_progress":     0.364,
      "uv_level":        "moderate",
      "uv_label":        "Moderate",
      "uv_advice":       "Wear sunscreen",
      "location": {
        "city":   "Kyiv",
        "region": "Kyiv · UA"
      }
    },
    "forecast": [
      { "day": "TUE", "icon": "wb_sunny", "weather_icon": "clear", "high": 22, "low": 14 },
      ...6 more days
    ]
  }
}
```

**Field notes**

| Field | Description |
|---|---|
| `weather_icon` | Slug for an animated SVG — resolves to `/weather/{slug}.svg` |
| `icon` | Material Symbols icon name for compact use |
| `wind_speed` / `wind_gust` | Open-Meteo outdoor wind values in km/h. |
| `wind_degrees` / `wind_direction` | Raw bearing in degrees and cardinal/intercardinal display label. |
| `wind_level` | Stable intensity token: `calm`, `light`, `breezy`, `windy`, or `strong`. |
| `uv_index` | WHO UV scale 0–11+ |
| `uv_max_today` | Open-Meteo daily maximum UV index forecast. |
| `uv_progress` | Normalized 0–1 position for dashboard UV gauges using an 11+ scale. |
| `uv_level` | Stable risk token: `low`, `moderate`, `high`, `very_high`, or `extreme`. |
| `forecast[].day` | Three-letter weekday abbreviation (MON–SUN) |

---

### GET `/api/v1/air-quality`

Current AirGradient PM2.5, CO₂, TVOC, and NOx readings with sparkline history. US AQI is derived from PM2.5 using EPA breakpoints.

**Response**

```json
{
  "data": {
    "aqi": 42,
    "category": {
      "name":      "Good",
      "color":     "#82DBA6",
      "container": "var(--md-good-container)",
      "on":        "var(--md-on-good-container)"
    },
    "pm25": 8.2,
    "co2":  612,
    "voc":  120,
    "nox":  1,
    "message": "Air quality is Good — safe for all activities",
    "sparklines": {
      "pm25": [7.1, 8.4, ...28 points],
      "co2":  [590, 605, ...28 points],
      "voc":  [118, 121, ...28 points],
      "nox":  [1, 1, ...28 points]
    }
  }
}
```

**AQI Category thresholds (US EPA)**

| AQI range | Name | Color |
|---|---|---|
| 0–50 | Good | `#82DBA6` |
| 51–100 | Moderate | `#FFD68A` |
| 101–150 | Unhealthy for Sensitive Groups | `#FFB59A` |
| 151–200 | Unhealthy | `#FFB4AB` |
| 201+ | Hazardous | `#FFB4AB` |

---

### GET `/api/v1/air-quality/readings`

Historical time series for the AirGradient PM2.5, CO₂, TVOC, and NOx channels.

**Response**

```json
{
  "data": {
    "window":     "12h",
    "resolution": "15min",
    "count":      48,
    "series": {
      "pm25": [8.1,  9.4,  ...48 points],
      "co2":  [590, 605, ...48 points],
      "voc":  [118, 121, ...48 points],
      "nox":  [1, 1, ...48 points]
    }
  }
}
```

**Field notes**

- Arrays are time-ordered, oldest first.
- `count` declares the expected length of each series array.

---

### GET `/api/v1/indoor-climate`

Indoor sensor readings from the AirGradient sensor array.

**Response**

```json
{
  "data": {
    "sensor_location": "AirGradient",
    "temperature": 24.3,
    "humidity":    59.7,
    "co2":         612,
    "voc":         120,
    "nox":         1,
    "sparklines": {
      "co2": [590, 605, ...28 points],
      "voc": [118, 121, ...28 points],
      "nox": [1, 1, ...28 points]
    }
  }
}
```

---

### GET `/api/v1/events`

Calendar events for a given date. This endpoint reads from Google Calendar using the configured location timezone. The `active` flag is `true` when the event is currently in progress. If Google Calendar credentials are missing or invalid, the endpoint returns the shared error envelope instead of sample data.

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | `string` (`YYYY-MM-DD`) | No | Date to return events for. Defaults to today in the configured location timezone. |

**Example** — `GET /api/v1/events?date=2026-05-28`

**Response**

```json
{
  "data": {
    "date": "2026-05-28",
    "events": [
      {
        "id":     "evt-001",
        "time":   "09:30",
        "ampm":   "AM",
        "title":  "Design Review · Aurora",
        "sub":    "Studio · with Mira & Theo",
        "active": false
      },
      ...
    ]
  }
}
```

**Active-window reference (configured location time)**

| Event | Window |
|---|---|
| 09:30 AM | 09:30–10:30 (60 min) |
| 11:00 AM | 11:00–12:00 (60 min) |
| 01:15 PM | 13:15–14:15 (60 min) |
| 03:00 PM | 15:00–16:00 (60 min) |
| 07:30 PM | 19:30–21:30 (120 min — movie) |

---

### GET `/api/v1/reminders`

All upcoming and recently completed reminders. Static mock; does not vary by date.

**Response**

```json
{
  "data": {
    "reminders": [
      { "id": "rem-001", "text": "Replace HEPA filter — bedroom", "when": "Today", "done": false },
      { "id": "rem-002", "text": "Reorder ground coffee · Drop Coffee", "when": "Tue", "done": false },
      { "id": "rem-003", "text": "Renew sensor calibration", "when": "Thu", "done": false },
      { "id": "rem-004", "text": "Water the monstera", "when": "Done", "done": true }
    ]
  }
}
```

---

### GET `/api/v1/daylight`

Sunrise, sunset, and daylight progress for today. All times are local to the configured location.

**Response**

```json
{
  "data": {
    "date":             "2026-05-28",
    "sunrise":          "05:24",
    "sunset":           "21:42",
    "progress":         0.6200,
    "day_length_hours": 16.30
  }
}
```

**Field notes**

| Field | Description |
|---|---|
| `progress` | Fraction of the daylight window elapsed. `0.0` = sunrise, `1.0` = sunset. Clamped to `[0, 1]`. |
| `date` | Configured location calendar date (`YYYY-MM-DD`). |
| `day_length_hours` | Total daylight duration in decimal hours from Open-Meteo. |

---

### GET `/api/v1/insights`

AI-generated home environment insight cards (static mock; rotated by the frontend on a 6-second timer).

**Response**

```json
{
  "data": {
    "insights": [
      {
        "id":    "ins-001",
        "icon":  "auto_awesome",
        "title": "Air quality has been Good for 14 days straight",
        "sub":   "longest streak this year"
      },
      ...
    ]
  }
}
```

**Field notes**

- `icon` is a Material Symbols icon name.
- The frontend cycles through all insights automatically; no pagination needed.

---

### GET `/api/v1/devices`

Status and latency of all sensors in the local mesh network.

**Response**

```json
{
  "data": {
    "total":      4,
    "online":     4,
    "latency_ms": 78,
    "devices": [
      { "id": "dev-001", "name": "Living Room Sensor", "type": "air_quality", "online": true, "latency_ms": 38 },
      { "id": "dev-002", "name": "Bedroom Sensor",     "type": "air_quality", "online": true, "latency_ms": 42 },
      { "id": "dev-003", "name": "Kitchen Sensor",     "type": "air_quality", "online": true, "latency_ms": 55 },
      { "id": "dev-004", "name": "Outdoor Station",    "type": "weather",     "online": true, "latency_ms": 180 }
    ]
  }
}
```

**Field notes**

- `latency_ms` at the top level is the average across all devices.
- `type` identifies the sensor role: `air_quality` or `weather`.

---

### GET `/api/v1/energy`

Current home energy consumption and solar generation.

**Response**

```json
{
  "data": {
    "consumption_w":      412,
    "solar_generation_w": 264,
    "solar_coverage_pct": 64,
    "grid_import_w":      148
  }
}
```

**Field notes**

| Field | Description |
|---|---|
| `consumption_w` | Total home power draw in Watts |
| `solar_generation_w` | Current PV output in Watts |
| `solar_coverage_pct` | `solar / consumption × 100`, capped at 100 |
| `grid_import_w` | Power drawn from the grid. `0` when solar covers all consumption. |

---

### GET `/api/health`

Health check. Not under `/v1/`.

**Response**

```json
{ "status": "ok", "version": "1.0.0" }
```
