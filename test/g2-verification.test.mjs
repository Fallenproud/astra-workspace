import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {snapshotG2, verifyG2Filesystem} from '../server/g2-verification.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'astra-g2-verifier-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'README.md'), 'Protected project documentation.');
  await writeFile(join(root, 'src/value.txt'), 'ASTRA_G2_BEFORE');
  return {root, baseline: await snapshotG2(root)};
}

test('G2 exact expected mutation passes filesystem verification', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'src/value.txt'), 'ASTRA_G2_AFTER');
  const r = await verifyG2Filesystem(f);
  assert.equal(r.result, 'verified'); assert.deepEqual(r.changedFiles, ['src/value.txt']);
});
test('G2 wrong content and extra newline fail exact verification', async t => {
  const f = await fixture(t);
  for (const contents of ['WRONG', 'ASTRA_G2_AFTER\n']) {
    await writeFile(join(f.root, 'src/value.txt'), contents);
    assert.equal((await verifyG2Filesystem(f)).result, 'verification_failed');
  }
});
test('G2 additional changed project file fails', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'src/value.txt'), 'ASTRA_G2_AFTER');
  await writeFile(join(f.root, 'README.md'), 'Unexpected change');
  assert.equal((await verifyG2Filesystem(f)).result, 'verification_failed');
});
test('G2 untracked hidden file fails', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'src/value.txt'), 'ASTRA_G2_AFTER');
  await writeFile(join(f.root, '.unexpected'), 'Unexpected');
  assert.equal((await verifyG2Filesystem(f)).result, 'verification_failed');
});
test('G2 missing target fails', async t => {
  const f = await fixture(t); await rm(join(f.root, 'src/value.txt'));
  assert.equal((await verifyG2Filesystem(f)).result, 'verification_failed');
});
test('G2 unchanged target cannot pass from backend completion text', async t => {
  const f = await fixture(t);
  const r = await verifyG2Filesystem({...f, modelText: 'Done. Verified successfully.', backendStatus: 'completed'});
  assert.equal(r.result, 'verification_failed'); assert.equal(r.checks.targetChanged, false);
});
test('G2 deletion of another project file fails', async t => {
  const f = await fixture(t); await writeFile(join(f.root, 'src/value.txt'), 'ASTRA_G2_AFTER');
  await rm(join(f.root, 'README.md'));
  assert.equal((await verifyG2Filesystem(f)).result, 'verification_failed');
});
