import { apiGet } from './client.js';

export const fetchReminders = (opts) => apiGet('/v1/reminders', opts);
