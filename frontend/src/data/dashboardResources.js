import { createPolledResource } from './createPolledResource';
import {
  fetchAirQuality,
  fetchAirQualityReadings,
  fetchDaylight,
  fetchEvents,
  fetchIndoorClimate,
  fetchInsights,
  fetchLocation,
  fetchReminders,
  fetchWeather,
  POLL,
} from '../api';

export function createDashboardResources() {
  return {
    airQuality:         createPolledResource(fetchAirQuality,         { interval: POLL.AIR_QUALITY }),
    airQualityReadings: createPolledResource(fetchAirQualityReadings, { interval: POLL.AIR_QUALITY }),
    daylight:           createPolledResource(fetchDaylight,           { interval: POLL.DAYLIGHT }),
    events:             createPolledResource(fetchEvents,             { interval: POLL.EVENTS }),
    indoorClimate:      createPolledResource(fetchIndoorClimate,      { interval: POLL.INDOOR_CLIMATE }),
    insights:           createPolledResource(fetchInsights,           { interval: POLL.INSIGHTS }),
    location:           createPolledResource(fetchLocation,           { interval: POLL.LOCATION }),
    reminders:          createPolledResource(fetchReminders,          { interval: POLL.REMINDERS }),
    weather:            createPolledResource(fetchWeather,            { interval: POLL.WEATHER }),
  };
}
