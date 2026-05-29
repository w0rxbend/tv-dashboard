import { createPolling } from './createPolling';
import { fetchDevices, fetchWeather, POLL } from '../api';

export function createDashboardResources() {
  return {
    devices: createPolling(fetchDevices, { interval: POLL.DEVICES }),
    weather: createPolling(fetchWeather, { interval: POLL.WEATHER }),
  };
}
