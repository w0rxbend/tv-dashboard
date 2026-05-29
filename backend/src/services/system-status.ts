import { config } from '../config.js';
import { toAppError } from '../lib/api-error.js';
import { localNow } from '../lib/time.js';
import { airGradient } from './airgradient.js';
import { googleCalendar } from './google-calendar.js';
import { fetchWeatherFromAPI } from './open-meteo.js';

export type SystemStatus = 'operational' | 'degraded' | 'down' | 'not_configured';

export interface SystemServiceStatus {
  key: string;
  label: string;
  status: SystemStatus;
  message: string;
  checked_at: string;
  details?: Record<string, unknown>;
}

export interface SystemStatusReport {
  status: 'operational' | 'degraded' | 'down';
  checked_at: string;
  services: SystemServiceStatus[];
}

interface ServiceCheck {
  key: string;
  label: string;
  check: () => Promise<SystemServiceStatus | void>;
}

const STATUS_RANK: Record<SystemStatus, number> = {
  down: 4,
  not_configured: 4,
  degraded: 2,
  operational: 1,
};

function checkedAt() {
  return new Date().toISOString();
}

function operational(key: string, label: string, message = 'Operational', details?: Record<string, unknown>): SystemServiceStatus {
  return { key, label, status: 'operational', message, checked_at: checkedAt(), ...(details ? { details } : {}) };
}

function unavailable(key: string, label: string, err: unknown): SystemServiceStatus {
  const appError = toAppError(err);
  const status: SystemStatus = appError.code.endsWith('_not_configured') || appError.code === 'calendar_not_configured'
    ? 'not_configured'
    : appError.status === 504 ? 'degraded' : 'down';
  const fallbackMessage = status === 'not_configured'
    ? `${label} is not configured`
    : `${label} is unreachable`;

  return {
    key,
    label,
    status,
    message: appError.message === 'fetch failed' ? fallbackMessage : appError.message,
    checked_at: checkedAt(),
    details: { code: appError.code },
  };
}

async function runCheck(service: ServiceCheck): Promise<SystemServiceStatus> {
  try {
    const result = await service.check();
    return result ?? operational(service.key, service.label);
  } catch (err) {
    return unavailable(service.key, service.label, err);
  }
}

function overallStatus(services: SystemServiceStatus[]): SystemStatusReport['status'] {
  const worst = services
    .map((service) => service.status)
    .sort((left, right) => STATUS_RANK[right] - STATUS_RANK[left])[0];

  if (worst === 'down' || worst === 'not_configured') return 'down';
  if (worst === 'degraded') return 'degraded';
  return 'operational';
}

export async function getSystemStatus(): Promise<SystemStatusReport> {
  const today = localNow(config.location.timezone).date;
  const services = await Promise.all([
    runCheck({
      key: 'airgradient',
      label: 'AirGradient',
      check: async () => {
        const current = await airGradient.current();
        return operational('airgradient', 'AirGradient', 'Sensor data reachable', {
          cached: Boolean(current.cached),
          timestamp: current.timestamp,
        });
      },
    }),
    runCheck({
      key: 'weather',
      label: 'Weather',
      check: async () => {
        await fetchWeatherFromAPI(config.location.latitude, config.location.longitude);
        return operational('weather', 'Weather', 'Open-Meteo reachable');
      },
    }),
    runCheck({
      key: 'calendar',
      label: 'Calendar',
      check: async () => {
        if (!googleCalendar.isConfigured()) {
          return {
            key: 'calendar',
            label: 'Calendar',
            status: 'not_configured',
            message: 'Google Calendar is not configured',
            checked_at: checkedAt(),
            details: { code: 'calendar_not_configured' },
          };
        }

        await googleCalendar.listEventsForDate(today, config.location.timezone);
        return operational('calendar', 'Calendar', 'Google Calendar reachable');
      },
    }),
    runCheck({
      key: 'reminders',
      label: 'Reminders',
      check: async () => operational('reminders', 'Reminders', 'Local reminders available'),
    }),
    runCheck({
      key: 'insights',
      label: 'Insights',
      check: async () => operational('insights', 'Insights', 'Local insights available'),
    }),
  ]);

  return {
    status: overallStatus(services),
    checked_at: checkedAt(),
    services,
  };
}
