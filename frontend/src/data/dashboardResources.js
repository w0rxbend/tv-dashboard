import { createPolling } from './createPolling';
import { fetchWeather, fetchAirQuality, fetchEvents, fetchReminders, POLL } from '../api';

export function createDashboardResources() {
  return {
    weather:    createPolling(fetchWeather,    { interval: POLL.WEATHER }),
    airQuality: createPolling(fetchAirQuality, { interval: POLL.AIR_QUALITY }),
    events:     createPolling(fetchEvents,     { interval: POLL.EVENTS }),
    reminders:  createPolling(fetchReminders,  { interval: POLL.REMINDERS }),
  };
}
