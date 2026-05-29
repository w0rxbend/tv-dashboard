export function resourceStatus(resource) {
  const error = resource?.error?.code === 'cancelled' ? null : resource?.error;
  const hasLatest = resource?.latest !== undefined && resource?.latest !== null;

  if (error && hasLatest) return 'degraded';
  if (error) return 'down';
  if (hasLatest) return 'ok';
  return 'checking';
}

export function serviceSnapshot(service) {
  const status = resourceStatus(service.resource);
  const messages = {
    ok:        'Live',
    degraded: 'Cached',
    checking: 'Checking',
    down:      service.resource?.error?.message ?? 'Unavailable',
  };

  return {
    ...service,
    status,
    message: messages[status],
  };
}

export function summarizeStatuses(statuses) {
  const down = statuses.filter((status) => status === 'down').length;
  const checking = statuses.filter((status) => status === 'checking').length;
  const live = statuses.filter((status) => status === 'ok' || status === 'degraded').length;

  return {
    down,
    checking,
    live,
    total: statuses.length,
  };
}
