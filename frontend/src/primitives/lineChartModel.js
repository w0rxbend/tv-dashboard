export function normalizeChartSeries(series) {
  return (series ?? [])
    .filter(s => s && Array.isArray(s.data))
    .map(s => ({ ...s, data: s.data.filter(Number.isFinite) }))
    .filter(s => s.data.length >= 2);
}
