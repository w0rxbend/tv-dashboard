export function cardErrorMessage(error) {
  if (!error) return '';
  if (error?.code === 'cancelled') return '';
  if (error?.code === 'timeout') return 'Request timed out — retrying';
  if (error?.code === 'calendar_not_configured') return 'Google Calendar is not configured';
  return error?.message ?? 'Failed to load';
}
