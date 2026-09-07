import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/index.mjs';

test('development rejects credentials, runs approved artifacts without network, and persists continuation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'astra-development-'));
 const runtime=await createApp({mode:'development',dataDir:dir,port:14329});
 const server=runtime.app.listen(14329,'127.0.0.1');
 const localFetch=globalThis.fetch;let outbound=0,cookie='';
 globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound request');};
 const call=async(path,body)=>{const r=await localFetch('http://127.0.0.1:14329/api'+path,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 const wait=async predicate=>{for(let i=0;i<100;i++){const result=predicate();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out');};
 try{
  assert.equal((await call('/auth/status')).data.mode,'development');
  assert.equal((await call('/auth/unlock',{passphrase:'dummy-input-not-a-real-secret'})).status,401);
  cookie=(await call('/auth/unlock',{})).cookie;
  assert.equal((await call('/providers',{apiKey:'dummy-key'})).status,403);
  assert.equal((await call('/connectors',{name:'test',url:'https://example.com'})).status,403);
  const project=(await call('/projects',{name:'Development acceptance'})).data;
  assert.equal((await call('/runs',{projectId:project.id,prompt:'test',backend:'codex'})).status,400);
  const run=(await call('/runs',{projectId:project.id,prompt:'Save a test artifact'})).data;
  const approval=await wait(()=>runtime.store.all('approvals').find(a=>a.runId===run.id&&a.status==='pending'));
  assert.equal((await call('/approvals/'+approval.id,{approved:true})).status,200);
  await wait(()=>runtime.store.get('runs',run.id).status==='completed');
  assert.equal(runtime.store.get('runs',run.id).simulated,true);
  assert.equal(runtime.store.get('runs',run.id).cost,0);
  assert.equal(runtime.store.all('artifacts').length,1);
  const second=(await call('/runs',{projectId:project.id,conversationId:run.conversationId,prompt:'Continue the saved task'})).data;
  const next=await wait(()=>runtime.store.all('approvals').find(a=>a.runId===second.id&&a.status==='pending'));
  assert.match(next.data.content,/Conversation messages available: 4/);
  await call('/approvals/'+next.id,{approved:false});
  await wait(()=>runtime.store.get('runs',second.id).status==='completed');
  assert.equal(outbound,0);
  assert.equal(runtime.store.all('providers').some(p=>p.secret),false);
  await assert.rejects(createApp({mode:'production',dataDir:dir,port:14330}),/separate data directory/);
 }finally{
  globalThis.fetch=localFetch;
  server.closeAllConnections();await new Promise(r=>server.close(r));runtime.store.close();
  await rm(dir,{recursive:true,force:true});
 }
});
