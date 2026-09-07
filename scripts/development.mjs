import {spawn} from 'node:child_process';
const env = {...process.env, ASTRA_MODE:'development'};
// Do not pass provider credentials inherited from the developer's shell to this runtime.
for (const name of Object.keys(env)) if (/(?:API_?KEY|SECRET|TOKEN|PASSWORD|PASSPHRASE)/i.test(name)) delete env[name];
const child = spawn(process.execPath, ['server/index.mjs'], {
  cwd:new URL('..',import.meta.url), stdio:'inherit', env
});
child.on('exit',code=>{process.exitCode=code??1;});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
