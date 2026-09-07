import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Store } from '../server/store.mjs';
import { Engine } from '../server/engine.mjs';
import { handleBackendRequest } from '../server/requests.mjs';

test('Codex questions wait for input, return protocol answers and redact secrets from audit', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'astra-questions-'));
  const store = new Store(dir);
  try {
    store.put('runs', { id: 'question-run', status: 'running' });
    const engine = new Engine(store, dir);
    engine.patch('question-run', { status: 'running' });
    const controller = new AbortController();
    const pending = handleBackendRequest({
      approve: (type, data) => engine.approve('question-run', type, data, controller.signal),
      emit: () => {},
    }, { method: 'item/tool/requestUserInput', params: { questions: [
      { id: 'scope', question: 'Which folder?', header: 'Scope' },
      { id: 'secret', question: 'Test secret?', header: 'Secret', isSecret: true },
    ] } });
    const request = store.all('approvals')[0];
    assert.equal(store.get('runs', 'question-run').status, 'awaiting_approval');
    assert.throws(() => engine.decide(request.id, true), /Answer the requested questions/);
    assert.throws(() => engine.answer(request.id, {}), /Answer every question/);
    engine.answer(request.id, { scope: 'current project', secret: 'fixture-secret-value' });
    const result = await pending;
    assert.deepEqual(result.answers.scope, { answers: ['current project'] });
    assert.deepEqual(result.answers.secret, { answers: ['fixture-secret-value'] });
    assert.equal(store.get('runs', 'question-run').status, 'running');
    assert.equal(store.get('approvals', request.id).status, 'answered');
    assert.ok(!JSON.stringify(store.all('events')).includes('fixture-secret-value'));
    assert.ok(!JSON.stringify(store.all('approvals')).includes('fixture-secret-value'));
    assert.throws(() => engine.answer(request.id, { scope: 'again', secret: 'again' }), /no longer active/);
  } finally {
    store.close();
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')));
    await rm(dir, { recursive: true, force: true });
  }
});

test('unsupported backend request is an error, never an invalid approval success', async () => {
  const events = [];
  await assert.rejects(handleBackendRequest({ approve: () => assert.fail('Unexpected approval'), emit: (...event) => events.push(event) }, { method: 'unknown/operation', params: {} }), /Unsupported backend request/);
  assert.equal(events[0][0], 'unsupported_request');
});
