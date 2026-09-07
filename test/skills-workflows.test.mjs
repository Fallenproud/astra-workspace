import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/index.mjs';
import {parseMermaid} from '../server/diagrams.mjs';
import {validatePackage} from '../server/skills.mjs';
test('native skill qualification, Archify receipts, sequential delegation, cancellation and restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'astra-skills-'));
 const runtime=await createApp({mode:'development',dataDir:dir,port:14331});
 const server=runtime.app.listen(14331,'127.0.0.1');let cookie='',completed=false;
 const call=async(path,body)=>{const r=await fetch('http://127.0.0.1:14331/api'+path,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 const wait=async fn=>{for(let i=0;i<200;i++){const v=fn();if(v)return v;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out');};
 try{
  assert.equal((await call('/skills')).status,401);cookie=(await call('/auth/unlock',{})).cookie;
  const catalog=(await call('/skills')).data;assert.equal(catalog.skills.length,20);assert.ok(catalog.skills.every(s=>s.package_path.startsWith('skills/')));
  const originalFetch=globalThis.fetch;try{globalThis.fetch=async()=>{throw Error('Offline registry')};await assert.rejects(runtime.skills.sync(),/Offline registry/);assert.equal(runtime.skills.catalog().source.revision,catalog.source.revision);}finally{globalThis.fetch=originalFetch;}
  const blocked=catalog.skills.find(s=>s.status==='defined');assert.equal((await call('/skills/'+blocked.id+'/activation',{enabled:true})).status,400);
  const id='agent-archify-001',detail=runtime.skills.detail(id);assert.throws(()=>validatePackage(detail,detail.metadata,detail.markdown+'tamper'),/integrity/);
  const project=(await call('/projects',{name:'Skills acceptance'})).data;
  const input={projectId:project.id,source:'flowchart LR\nA[Request] --> B[Delegate]\nB --> C[Result]'};
  assert.equal((await call('/skills/'+id+'/invoke',input)).status,400);
  await call('/skills/'+id+'/activation',{enabled:true});
  const diagram=await call('/skills/'+id+'/invoke',input);assert.equal(diagram.status,201,JSON.stringify(diagram.data));assert.equal(diagram.data.receipt.ok,true);assert.equal(diagram.data.browserVerified,false);assert.equal(diagram.data.skill.id,id);
  assert.match(await readFile(runtime.store.get('diagrams',diagram.data.id).path,'utf8'),/<svg/);
  assert.equal(parseMermaid('flowchart LR\nA --> B\nA --> C').edges.length,2);assert.throws(()=>parseMermaid('flowchart LR\nA --> B\nB --> A'),/no edges were discarded/);
  assert.equal((await call('/skills/'+id+'/invoke',{...input,source:'flowchart LR\nA --> A'})).status,400);
  assert.equal(runtime.store.all('diagrams').length,1,'Failed candidates preserve prior artifacts');
  assert.deepEqual(runtime.store.all('skill-invocations').map(i=>i.status),['completed','failed']);
  const agent=(await call('/agents',{name:'Reviewer',instructions:'Review supplied test content.'})).data;
  const workflow=(await call('/workflows',{projectId:project.id,name:'Two steps',steps:[{agentId:agent.id,prompt:'First step'},{agentId:agent.id,prompt:'Second step'}]})).data;
  const first=await wait(()=>runtime.store.all('approvals').find(a=>a.status==='pending'));
  assert.equal(runtime.store.all('runs').length,1,'Only first delegated run starts before its approval');await call('/approvals/'+first.id,{approved:true});
  const second=await wait(()=>runtime.store.all('approvals').find(a=>a.status==='pending'));
  assert.notEqual(first.runId,second.runId);assert.match(runtime.store.get('runs',second.runId).prompt,/Previous step output/);await call('/approvals/'+second.id,{approved:true});
  await wait(()=>runtime.store.get('workflows',workflow.id).status==='completed');
  assert.equal(runtime.store.get('runs',second.runId).workflowId,workflow.id);
  const cancelled=(await call('/workflows',{projectId:project.id,name:'Cancel steps',steps:[{agentId:agent.id,prompt:'Wait'},{agentId:agent.id,prompt:'Must not start'}]})).data;
  await wait(()=>runtime.store.all('approvals').find(a=>a.status==='pending'));await call('/workflows/'+cancelled.id+'/cancel',{});await wait(()=>!runtime.workflows.active.size);
  assert.equal(runtime.store.get('workflows',cancelled.id).steps[1].runId,null);
  assert.equal(runtime.store.get('workflows',cancelled.id).status,'cancelled');completed=true;
 }finally{
  for(const id of runtime.workflows.active.keys())runtime.workflows.cancel(id);
  server.closeAllConnections();await new Promise(r=>server.close(r));runtime.store.close();
  const restored=await createApp({mode:'development',dataDir:dir,port:14331});if(completed){assert.equal(restored.store.all('diagrams').length,1);assert.equal(restored.skills.detail('agent-archify-001').compatibility.state,'READY');}restored.store.close();
  await rm(dir,{recursive:true,force:true});
 }
});
