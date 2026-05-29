import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from './app.js';

test('health check returns ok', async () => {
  const res = await app.fetch(new Request('http://localhost/api/health'));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', version: '1.0.0' });
});

test('unknown routes use the structured error envelope', async () => {
  const res = await app.fetch(new Request('http://localhost/api/nope'));
  const body = await res.json();

  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'not_found');
  assert.equal(typeof body.error.message, 'string');
});

test('events date query must be a valid ISO calendar date', async () => {
  const res = await app.fetch(new Request('http://localhost/api/v1/events?date=2026-13-40'));
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'validation_error');
  assert.ok(Array.isArray(body.error.details));
});

test('OpenAPI documents upstream-backed error responses', async () => {
  const res = await app.fetch(new Request('http://localhost/api/openapi.json'));
  const spec = await res.json();

  assert.equal(res.status, 200);
  for (const path of ['/api/v1/weather', '/api/v1/air-quality', '/api/v1/daylight']) {
    assert.ok(spec.paths[path].get.responses['502']);
    assert.ok(spec.paths[path].get.responses['503']);
    assert.ok(spec.paths[path].get.responses['504']);
  }
});
