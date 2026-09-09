import {readdir, readFile, lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

// Astra-owned filesystem evidence; backend text is intentionally not an input.
export async function snapshotG2(root) {
  const files = Object.create(null);
  async function walk(dir, prefix = '') {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      // Git internals are not project content. Everything else, including hidden
      // and untracked project files, participates in the comparison.
      if (!prefix && entry.name === '.git') continue;
      const name = prefix + entry.name, path = join(dir, entry.name);
      const info = await lstat(path);
      if (info.isSymbolicLink()) throw Error('G2 rejects symbolic links: ' + name);
      if (info.isDirectory()) await walk(path, name + '/');
      else if (info.isFile()) files[name] = createHash('sha256').update(await readFile(path)).digest('hex');
      else throw Error('Unsupported filesystem entry: ' + name);
    }
  }
  await walk(root);
  return files;
}

export async function verifyG2Filesystem({root, baseline, expected = 'ASTRA_G2_AFTER'}) {
  const target = 'src/value.txt';
  try {
    const after = await snapshotG2(root);
    const changedFiles = [...new Set([...Object.keys(baseline), ...Object.keys(after)])]
      .filter(name => baseline[name] !== after[name]).sort();
    const exists = Object.hasOwn(after, target);
    const contents = exists ? await readFile(join(root, target), 'utf8') : null;
    const checks = {
      targetExists: exists,
      exactContent: contents === expected,
      targetChanged: changedFiles.includes(target),
      noUnexpectedChanges: changedFiles.every(name => name === target),
    };
    return {kind: 'filesystem_verification', result: Object.values(checks).every(Boolean) ? 'verified' : 'verification_failed',
      checks, changedFiles, targetSha256: after[target] ?? null, targetContents: contents?.slice(0, 4096) ?? null,
      verifiedAt: new Date().toISOString(), scope: 'Filesystem only; does not prove sandbox, backend, approvals or cleanup.'};
  } catch (error) {
    return {kind: 'filesystem_verification', result: 'verification_failed', error: error.message,
      verifiedAt: new Date().toISOString()};
  }
}
