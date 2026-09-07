import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const bindings=JSON.parse(readFileSync(new URL('../profiles/astra/runtime-bindings.json',import.meta.url),'utf8'));
import {createHash} from 'node:crypto';
const repository='Fallenproud/skill-hub-registry';
const base=new URL('../config/skill-hub/',import.meta.url);
const hash=(...values)=>{const h=createHash('sha256');for(const v of values)h.update(v);return h.digest('hex')};
export function validatePackage(entry,metadata,markdown){
 if(!/^skills\/[a-z0-9-]+\/[a-z0-9-]+$/.test(entry.package_path)||!/^[-a-z0-9]+$/.test(entry.id))throw Error('Only native packages are supported');
 if(metadata.id!==entry.id||metadata.version!==entry.version||metadata.status!==entry.status||metadata.execution?.kind!==entry.execution_kind||hash(JSON.stringify(metadata),'\n',markdown)!==entry.content_hash)throw Error('Skill package integrity check failed: '+entry.id);
 return {...entry,metadata,markdown};
}
export class SkillsRegistry{
 constructor(store,engine,diagrams,mode){Object.assign(this,{store,engine,diagrams,mode});this.syncing=false;}
 async initialize(){if(this.store.get('system','skill-registry'))return;
  const index=JSON.parse(await readFile(new URL('index.json',base),'utf8')),source=JSON.parse(await readFile(new URL('source.json',base),'utf8'));
  const packages=[];for(const entry of index.skills){const meta=JSON.parse(await readFile(new URL('packages/'+entry.id+'/skill.json',base),'utf8')),markdown=await readFile(new URL('packages/'+entry.id+'/SKILL.md',base),'utf8');packages.push(validatePackage(entry,meta,markdown));}
  this.save(index,source,packages);
 }
 save(index,source,packages){this.store.transaction(()=>{for(const p of this.store.all('skill-definitions'))this.store.remove('skill-definitions',p.id);for(const p of packages)this.store.put('skill-definitions',p);this.store.put('system',{id:'skill-registry',...source,registryHash:index.registry_hash,count:packages.length});});}
 async sync(){if(this.syncing)throw Error('Registry refresh already active');this.syncing=true;try{
  const get=async url=>{const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Registry fetch returned '+r.status);const t=await r.text();if(t.length>2e6)throw Error('Registry response too large');return t};
  const commit=JSON.parse(await get('https://api.github.com/repos/'+repository+'/commits/main')).sha;if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid registry revision');
  const url='https://raw.githubusercontent.com/'+repository+'/'+commit+'/',index=JSON.parse(await get(url+'generated/registry.index.json'));
  if(index.schema_version!=='1.0'||!Array.isArray(index.skills)||index.skills.length>200||index.count!==index.skills.length)throw Error('Unsupported registry index');
  const packages=[];for(const e of index.skills){if(!/^skills\/[a-z0-9-]+\/[a-z0-9-]+$/.test(e.package_path))throw Error('Non-native registry entry');packages.push(validatePackage(e,JSON.parse(await get(url+e.package_path+'/skill.json')),await get(url+e.package_path+'/SKILL.md')));}
  this.save(index,{repository,revision:commit,fetchedAt:new Date().toISOString()},packages);return this.catalog();
 }finally{this.syncing=false}}
 resolve(skill){
  const enabled=this.store.get('skill-activations','activation:'+skill.id)?.hash===skill.content_hash;
  let reason='',binding=null;
  if(!['validated','executable'].includes(skill.status))reason='Definition has not passed qualification.';
  else if(bindings[skill.id]?.adapter==='archify-local')binding=bindings[skill.id].adapter;
  else reason='No qualified Astra runtime binding for this skill yet.';
  return {state:reason?'BLOCKED':enabled?'READY':'AVAILABLE',reason:reason||'Local Node renderer; no model, credentials or external calls required.',binding,enabled:!reason&&enabled,runtime:this.mode==='development'?'development simulator':'configured production backend'};
 }
 catalog(){return {source:this.store.get('system','skill-registry'),skills:this.store.all('skill-definitions').map(({markdown,metadata,...s})=>({...s,compatibility:this.resolve(s)}))};}
 detail(id){const s=this.store.get('skill-definitions',id);if(!s)throw Error('Unknown skill');return {...s,compatibility:this.resolve(s)};}
 activate(id,enabled){if(typeof enabled!=='boolean')throw Error('Explicit activation decision required');const s=this.detail(id);if(enabled&&s.compatibility.state==='BLOCKED')throw Error(s.compatibility.reason);this.store.put('skill-activations',{id:'activation:'+id,skillId:id,hash:enabled?s.content_hash:null,enabled,changedAt:new Date().toISOString()});return this.detail(id);}
 async invoke(id,data){const s=this.detail(id);if(!s.compatibility.enabled)throw Error('Resolve compatibility and enable this skill first.');if(!this.store.get('projects',data.projectId))throw Error('Choose a project');
  const skill={id:s.id,version:s.version,contentHash:s.content_hash,registryRevision:this.catalog().source.revision,binding:s.compatibility.binding};
  const event=this.store.put('skill-invocations',{skill,projectId:data.projectId,status:'running',createdAt:new Date().toISOString()});
  try{const diagram=await this.diagrams.render({source:String(data.source||''),projectId:data.projectId,skill});this.store.put('skill-invocations',{...event,status:'completed',diagramId:diagram.id,endedAt:new Date().toISOString()});return diagram;}catch(e){this.store.put('skill-invocations',{...event,status:'failed',error:e.message,endedAt:new Date().toISOString()});throw e;}
 }
}
