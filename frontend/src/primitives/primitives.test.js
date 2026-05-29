import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardErrorMessage } from './cardErrorMessage.js';
import { normalizeChartSeries } from './lineChartModel.js';

test('cardErrorMessage hides cancellations and describes timeouts', () => {
  assert.equal(cardErrorMessage(), '');
  assert.equal(cardErrorMessage({ code: 'cancelled' }), '');
  assert.equal(cardErrorMessage({ code: 'timeout' }), 'Request timed out — retrying');
  assert.equal(cardErrorMessage({ code: 'calendar_not_configured', message: 'HTTP 503' }), 'Google Calendar is not configured');
  assert.equal(cardErrorMessage({ message: 'No route' }), 'No route');
});

test('normalizeChartSeries removes invalid and undersized series', () => {
  assert.deepEqual(
    normalizeChartSeries([
      { data: [1, Number.NaN, 2, Infinity], color: 'red' },
      { data: [5], color: 'blue' },
      { nope: true },
      null,
    ]),
    [{ data: [1, 2], color: 'red' }],
  );
});
