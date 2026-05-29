import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resourceStatus, serviceSnapshot, summarizeStatuses } from './resourceStatus.js';

test('resourceStatus classifies live, checking, degraded, and down resources', () => {
  assert.equal(resourceStatus({ latest: { ok: true } }), 'ok');
  assert.equal(resourceStatus({ loading: true }), 'checking');
  assert.equal(resourceStatus({ latest: { ok: true }, error: new Error('stale') }), 'degraded');
  assert.equal(resourceStatus({ error: new Error('offline') }), 'down');
  assert.equal(resourceStatus({ error: { code: 'cancelled' } }), 'checking');
});

test('serviceSnapshot and summarizeStatuses build dashboard status metadata', () => {
  const live = serviceSnapshot({ label: 'Weather', resource: { latest: { current: {} } } });
  const down = serviceSnapshot({ label: 'Calendar', resource: { error: new Error('Not configured') } });
  const summary = summarizeStatuses([live.status, down.status, 'checking', 'degraded']);

  assert.equal(live.message, 'Live');
  assert.equal(down.message, 'Not configured');
  assert.deepEqual(summary, { down: 1, checking: 1, live: 2, total: 4 });
});
