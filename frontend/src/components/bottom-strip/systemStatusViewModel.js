import { resourceStatus, summarizeStatuses } from '../../data/resourceStatus';

const STATUS_RANK = {
  down: 4,
  checking: 3,
  degraded: 2,
  ok: 1,
};

function worstStatus(resources) {
  return resources
    .map(resourceStatus)
    .sort((left, right) => STATUS_RANK[right] - STATUS_RANK[left])[0] ?? 'checking';
}

function statusMessage(status, resources) {
  if (status === 'down') {
    const error = resources.find((resource) => resource?.error?.code !== 'cancelled' && resource?.error)?.error;
    return error?.message ?? 'Unavailable';
  }

  return {
    ok: 'Live',
    degraded: 'Cached',
    checking: 'Checking',
  }[status] ?? 'Checking';
}

function serviceGroup({ key, label, icon, resources }) {
  const status = worstStatus(resources);
  return {
    icon,
    key,
    label,
    message: statusMessage(status, resources),
    status,
  };
}

export function createSystemStatusModel(resources) {
  const services = [
    serviceGroup({
      key: 'airgradient',
      label: 'AirGradient',
      icon: 'sensors',
      resources: [resources.airQuality, resources.airQualityReadings, resources.indoorClimate],
    }),
    serviceGroup({
      key: 'weather',
      label: 'Weather',
      icon: 'partly_cloudy_day',
      resources: [resources.weather, resources.daylight, resources.location],
    }),
    serviceGroup({
      key: 'calendar',
      label: 'Calendar',
      icon: 'event_available',
      resources: [resources.events],
    }),
    serviceGroup({
      key: 'tasks',
      label: 'Reminders',
      icon: 'checklist',
      resources: [resources.reminders],
    }),
    serviceGroup({
      key: 'insights',
      label: 'Insights',
      icon: 'auto_awesome',
      resources: [resources.insights],
    }),
  ];
  const counts = summarizeStatuses(services.map((service) => service.status));
  const summary = (() => {
    if (counts.down) return `${counts.down} feed${counts.down === 1 ? '' : 's'} unavailable`;
    if (counts.checking) return 'Checking data feeds';
    return 'All systems operational';
  })();

  return { counts, services, summary };
}
