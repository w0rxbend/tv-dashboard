export function cardErrorMessage(error) {
  if (!error) return '';
  if (error?.code === 'cancelled') return '';
  if (error?.code === 'timeout') return 'Request timed out — retrying';
  return error?.message ?? 'Failed to load';
}
