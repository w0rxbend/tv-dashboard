/** Returns the current date and wall-clock minutes in the given IANA timezone. */
export function localNow(timezone: string): { date: string; totalMinutes: number } {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return {
    date:         `${get('year')}-${get('month')}-${get('day')}`,
    totalMinutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function timeZoneOffsetMs(timezone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)!.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - date.getTime();
}

/** Converts a timezone-local wall-clock time to a UTC instant. */
export function zonedTimeToUtc(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallTimeMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = wallTimeMs;

  for (let i = 0; i < 3; i += 1) {
    utcMs = wallTimeMs - timeZoneOffsetMs(timezone, new Date(utcMs));
  }

  return new Date(utcMs);
}

export function addIsoDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function localDateRangeUtc(date: string, timezone: string): { start: Date; end: Date } {
  return {
    start: zonedTimeToUtc(date, '00:00', timezone),
    end: zonedTimeToUtc(addIsoDays(date, 1), '00:00', timezone),
  };
}

/** Extracts HH:MM from an ISO8601 datetime string like "2026-05-28T04:55". */
export function hhmm(isoLocal: string): string {
  return isoLocal.split('T')[1].slice(0, 5);
}

/** Parses an HH:MM string into total minutes since midnight. */
export function hhmmToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
