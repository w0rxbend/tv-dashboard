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

/** Extracts HH:MM from an ISO8601 datetime string like "2026-05-28T04:55". */
export function hhmm(isoLocal: string): string {
  return isoLocal.split('T')[1].slice(0, 5);
}

/** Parses an HH:MM string into total minutes since midnight. */
export function hhmmToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
