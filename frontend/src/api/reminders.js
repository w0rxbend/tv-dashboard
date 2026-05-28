import { apiGet } from './client.js';

export const fetchReminders = () => apiGet('/v1/reminders');
