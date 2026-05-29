export const WIND_SPEED_MAX = 70;
export const UV_SCALE_MAX = 11;

export const WIND_THEMES = {
  calm:   { accent: '#B8D7FF', ink: '#D9EAFF', soft: 'rgba(90, 151, 214, 0.20)' },
  light:  { accent: '#9FD7FF', ink: '#D8F0FF', soft: 'rgba(63, 171, 226, 0.22)' },
  breezy: { accent: '#86D7D5', ink: '#D8F7F6', soft: 'rgba(83, 190, 188, 0.22)' },
  windy:  { accent: '#FFD68A', ink: '#FFF0CE', soft: 'rgba(255, 214, 138, 0.20)' },
  strong: { accent: '#FFB4AB', ink: '#FFDAD6', soft: 'rgba(255, 180, 171, 0.22)' },
};

export const UV_THEMES = {
  low:       { accent: '#82DBA6', soft: 'rgba(130, 219, 166, 0.22)', ink: '#D9F8E6' },
  moderate:  { accent: '#FFD68A', soft: 'rgba(255, 214, 138, 0.24)', ink: '#FFF0CE' },
  high:      { accent: '#FFB59A', soft: 'rgba(255, 181, 154, 0.25)', ink: '#FFE1D5' },
  very_high: { accent: '#FFB4AB', soft: 'rgba(255, 180, 171, 0.27)', ink: '#FFDAD6' },
  extreme:   { accent: '#D0BCFF', soft: 'rgba(208, 188, 255, 0.25)', ink: '#EADDFF' },
};

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function normalizedNumber(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizedDegrees(value) {
  const number = normalizedNumber(value);
  if (number == null) return null;
  return Math.round(((number % 360) + 360) % 360);
}

export function windLevelFromSpeed(speed) {
  if (speed == null) return 'calm';
  if (speed < 2) return 'calm';
  if (speed < 13) return 'light';
  if (speed < 29) return 'breezy';
  if (speed < 39) return 'windy';
  return 'strong';
}

export function uvLevelFromIndex(index) {
  if (index == null) return 'low';
  if (index <= 2) return 'low';
  if (index <= 5) return 'moderate';
  if (index <= 7) return 'high';
  if (index <= 10) return 'very_high';
  return 'extreme';
}

export function createWindModel(currentWeather) {
  const speed = normalizedNumber(currentWeather?.wind_speed);
  const gust = normalizedNumber(currentWeather?.wind_gust);
  const bearing = normalizedDegrees(currentWeather?.wind_degrees) ?? 0;
  const level = currentWeather?.wind_level ?? windLevelFromSpeed(speed);
  const theme = WIND_THEMES[level] ?? WIND_THEMES.calm;
  const strongestWind = Math.max(speed ?? 0, gust ?? 0);

  return {
    advice: currentWeather?.wind_advice ?? 'Waiting for wind data',
    ariaLabel: speed == null
      ? 'Outdoor wind loading'
      : `Outdoor wind ${Math.round(speed)} kilometers per hour from ${currentWeather?.wind_direction ?? 'unknown direction'}`,
    bearing,
    direction: currentWeather?.wind_direction ?? '-',
    gustText: gust == null ? '-' : Math.round(gust),
    isLoading: !currentWeather,
    label: currentWeather?.wind_label ?? 'Loading',
    speedText: speed == null ? '-' : Math.round(speed),
    strength: `${Math.round(clamp01(strongestWind / WIND_SPEED_MAX) * 100)}%`,
    theme,
  };
}

export function createUvIndexModel(currentWeather) {
  const uvIndex = normalizedNumber(currentWeather?.uv_index);
  const providedProgress = normalizedNumber(currentWeather?.uv_progress);
  const progress = providedProgress != null
    ? clamp01(providedProgress)
    : uvIndex == null ? 0 : clamp01(uvIndex / UV_SCALE_MAX);
  const level = currentWeather?.uv_level ?? uvLevelFromIndex(uvIndex);
  const maxToday = normalizedNumber(currentWeather?.uv_max_today);
  const label = currentWeather?.uv_label ?? 'Loading';

  return {
    advice: currentWeather?.uv_advice ?? 'Waiting for solar data',
    ariaLabel: uvIndex == null ? 'UV index loading' : `UV index ${uvIndex}, ${label}`,
    fill: `${Math.round(progress * 100)}%`,
    isLoading: !currentWeather,
    label,
    maxTodayText: maxToday == null ? '-' : Math.round(maxToday),
    theme: UV_THEMES[level] ?? UV_THEMES.low,
    valueText: uvIndex == null ? '-' : Math.round(uvIndex),
  };
}
