import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoot } from 'solid-js';
import { createPolledResource } from './createPolledResource.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('createPolledResource aborts in-flight work on cleanup', async () => {
  let capturedSignal;
  let dispose;

  createRoot((rootDispose) => {
    dispose = rootDispose;
    createPolledResource(({ signal }) => {
      capturedSignal = signal;
      return new Promise(() => {});
    }, { interval: 50 });
  });

  await wait(0);
  dispose();

  assert.equal(capturedSignal.aborted, true);
});

test('createPolledResource skips interval refetches while loading', async () => {
  let calls = 0;
  let resolveRequest;
  let dispose;

  createRoot((rootDispose) => {
    dispose = rootDispose;
    createPolledResource(() => {
      calls += 1;
      return new Promise(resolve => { resolveRequest = resolve; });
    }, { interval: 5 });
  });

  await wait(25);
  assert.equal(calls, 1);

  resolveRequest('ok');
  await wait(0);
  dispose();
});
