import { apiGet } from './client.js';

/**
 * @param {string} [date] ISO 8601 date string — defaults to today server-side.
 */
export const fetchEvents = (date) => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet(`/v1/events${qs}`);
};
