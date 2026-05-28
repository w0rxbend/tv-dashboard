/**
 * Static mock dataset.
 * Swap individual providers (location, weather, calendar, reminders)
 * with real API adapters without touching component code.
 */
export const SEED = {
  location: {
    city: 'Stockholm',
    region: 'Södermalm · SE',
  },
  sun: {
    sunrise: '05:24',
    sunset: '21:42',
    /** Fraction of daylight elapsed (0 = sunrise, 1 = sunset) */
    progress: 0.62,
  },
  forecast: [
    { d: 'TUE', icon: 'wb_sunny',          hi: 22, lo: 14 },
    { d: 'WED', icon: 'partly_cloudy_day', hi: 24, lo: 15 },
    { d: 'THU', icon: 'partly_cloudy_day', hi: 23, lo: 14 },
    { d: 'FRI', icon: 'rainy',             hi: 19, lo: 13 },
    { d: 'SAT', icon: 'thunderstorm',      hi: 18, lo: 12 },
    { d: 'SUN', icon: 'cloud',             hi: 20, lo: 13 },
    { d: 'MON', icon: 'wb_sunny',          hi: 23, lo: 15 },
  ],
  events: [
    { time: '09:30', ampm: 'AM', title: 'Design Review · Aurora',   sub: 'Studio · with Mira & Theo',    active: true  },
    { time: '11:00', ampm: 'AM', title: 'AirGradient firmware OTA', sub: 'Pi mesh · 4 sensors queued',   active: false },
    { time: '01:15', ampm: 'PM', title: 'Lunch · Linnea',           sub: 'Spritzhaus · table for two',   active: false },
    { time: '03:00', ampm: 'PM', title: 'Pickup · Noa',             sub: 'Vasaparken · soccer practice', active: false },
    { time: '07:30', ampm: 'PM', title: 'Movie night',              sub: 'Living room · queue ready',    active: false },
  ],
  reminders: [
    { text: 'Replace HEPA filter — bedroom',       when: 'Today', done: false },
    { text: 'Reorder ground coffee · Drop Coffee', when: 'Tue',   done: false },
    { text: 'Renew sensor calibration',            when: 'Thu',   done: false },
    { text: 'Water the monstera',                  when: 'Done',  done: true  },
  ],
};
