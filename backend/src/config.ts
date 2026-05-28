// ─── Application configuration ───────────────────────────────────────────────
// All values are driven by environment variables; the defaults point to Kyiv.

function requireFiniteNumber(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${envVar}="${raw}" is not a valid number`);
  return n;
}

export const config = {
  location: {
    city:      process.env.LOCATION_CITY     ?? 'Kyiv',
    region:    process.env.LOCATION_REGION   ?? 'Kyiv · UA',
    country:   process.env.LOCATION_COUNTRY  ?? 'UA',
    timezone:  process.env.LOCATION_TIMEZONE ?? 'Europe/Kiev',
    latitude:  requireFiniteNumber('LOCATION_LAT', 50.4501),
    longitude: requireFiniteNumber('LOCATION_LON', 30.5234),
  },
};
