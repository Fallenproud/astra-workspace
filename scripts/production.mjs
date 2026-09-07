import {spawn} from 'node:child_process';
const child = spawn(process.execPath, ['server/index.mjs'], {
  cwd: new URL('..', import.meta.url), stdio:'inherit',
  env:{...process.env, ASTRA_MODE:'production'}
});
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
