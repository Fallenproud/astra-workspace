import {composeWorkspace,adaptWorkspace,reshapeWorkspace} from './workspace-composer.mjs';
import {mkdir,writeFile,realpath,lstat,readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve,basename,sep,relative} from 'node:path';
import {randomUUID} from 'node:crypto';
import {unseal} from './security.mjs';
import {BrowserTools} from './browser.mjs';
import {runResponses} from './responses.mjs';
import {runCodex} from './codex.mjs';
import {runDevelopment} from './development.mjs';
export const defaults={id:'settings',model:'gpt-6-astra',reasoning:'high',backend:'responses',providerId:'',maxOutput:8192,contextLimit:32000,maxSteps:8,maxDuration:300,monthlyTokens:1000000,webSearch:false,browser:false};
export class Engine{
 constructor(store,dir,{mode='production'}={}){this.mode=mode;this.store=store;this.dir=dir;this.active=new Map();this.waiters=new Map();for(const r of store.all('runs'))if(['queued','running','awaiting_approval'].includes(r.status)){store.put('runs',{...r,status:'interrupted',endedAt:new Date().toISOString(),error:'Server restarted. Review events and continue explicitly.'});this.emit(r.id,'interrupted',{reason:'Server restarted'})}for(const a of store.all('approvals'))if(a.status==='pending')store.put('approvals',{...a,status:'expired'});}
 emit(runId,type,data){return this.store.put('events',{runId,type,data,createdAt:new Date().toISOString()})}
 patch(id,values){return this.store.put('runs',{...this.store.get('runs',id),...values})}
 async approve(id,type,data,signal){if(signal.aborted)throw Error('Run cancelled');const a=this.store.put('approvals',{runId:id,type,data,status:'pending',createdAt:new Date().toISOString()});this.patch(id,{status:'awaiting_approval'});this.emit(id,'approval_requested',{approvalId:a.id,type,data});return new Promise((resolve,reject)=>{const abort=()=>{this.waiters.delete(a.id);this.store.put('approvals',{...this.store.get('approvals',a.id),status:'expired'});reject(Error('Run cancelled'))};signal.addEventListener('abort',abort,{once:true});this.waiters.set(a.id,ok=>{signal.removeEventListener('abort',abort);this.patch(id,{status:'running'});resolve(ok)})})}
 decide(id,ok){const a=this.store.get('approvals',id),wait=this.waiters.get(id);if(!a||a.status!=='pending'||!wait)throw Error('Approval is no longer active');if(a.type==='user_input')throw Error('Answer the requested questions instead.');this.store.put('approvals',{...a,status:ok?'approved':'denied',decidedAt:new Date().toISOString()});this.emit(a.runId,'approval_decided',{approvalId:id,approved:ok});this.waiters.delete(id);wait(ok)}
 answer(id,values){
  const a=this.store.get('approvals',id),wait=this.waiters.get(id);
  if(!a||a.type!=='user_input'||a.status!=='pending'||!wait)throw Error('Question is no longer active');
  const answers=Object.create(null),record=Object.create(null);
  for(const q of a.data.questions||[]){
   const value=values?.[q.id];
   if(typeof value!=='string'||!value.trim()||value.length>10000)throw Error('Answer every question using at most 10,000 characters.');
   answers[q.id]={answers:[value.trim()]};record[q.id]=q.isSecret?'[redacted]':value.trim();
  }
  this.store.put('approvals',{...a,status:'answered',answers:record,decidedAt:new Date().toISOString()});
  this.emit(a.runId,'user_input_answered',{approvalId:id,answers:record});this.waiters.delete(id);wait(answers);
 }
 cancel(id){const a=this.active.get(id);if(!a)throw Error('Run is not active');a.controller.abort()}
 async artifact(run,name,content,kind='generated'){name=basename(String(name)).replace(/[^a-zA-Z0-9._-]/g,'_');if(!name||name==='.'||name==='..'||content.length>500000)throw Error('Invalid artifact name or size');const id=randomUUID(),dir=join(this.dir,'artifacts');await mkdir(dir,{recursive:true});const path=join(dir,id);await writeFile(path,content);const item=this.store.put('artifacts',{id,projectId:run.projectId,runId:run.id,name,path,kind,size:Buffer.byteLength(content),createdAt:new Date().toISOString()});this.emit(run.id,'artifact_created',{id,name,size:item.size});const adapted=adaptWorkspace(this.store,run,'artifacts','An approved artifact was produced; expose its persistent result.');if(adapted)this.emit(run.id,'workspace_adapted',{layoutId:adapted.id,panels:adapted.panels,reason:adapted.reason});return {id,name,size:item.size}}
 async collectCodeArtifacts(run,project){const base=await realpath(project.path);let count=0;const walk=async(dir,depth=0)=>{if(depth>5||count>=100)return;for(const ent of await readdir(dir,{withFileTypes:true})){if(ent.name.startsWith('.')||['node_modules','inputs','dist','build','__pycache__'].includes(ent.name)||ent.isSymbolicLink())continue;const path=join(dir,ent.name);const real=await realpath(path);if(!real.startsWith(base+sep))continue;if(ent.isDirectory())await walk(path,depth+1);else if(ent.isFile()&&/\.(md|txt|json|js|jsx|ts|tsx|py|html|css|sql|yml|yaml|toml|csv|rs|go)$/.test(ent.name)){const info=await stat(path);if(info.size>500000||info.mtimeMs<Date.parse(run.startedAt||run.createdAt))continue;const content=await readFile(path);await this.artifact(run,relative(base,path).replaceAll(sep,'__'),content,'code');if(++count>=100)return}}};await walk(base);}
 start(data,session){
 const settings={...defaults,...this.store.get('system','settings')};const project=this.store.get('projects',data.projectId);if(!project)throw Error('Choose a project first.');
 const provider=this.store.get('providers',data.providerId||settings.providerId);if(!provider)throw Error('Connect a provider first.');
 if(data.agentId&&!this.store.get('agents',data.agentId))throw Error('The selected agent no longer exists.');
 if(this.active.size>=2)throw Error('Two runs are already active. Wait or cancel one.');
 let conversation=data.conversationId?this.store.get('conversations',data.conversationId):null;if(data.conversationId&&(!conversation||conversation.projectId!==project.id))throw Error('Conversation does not belong to this project');
 if(conversation&&[...this.active.values()].some(x=>x.conversationId===conversation.id))throw Error('This conversation already has an active run.');
 const backend=data.backend||settings.backend;if(!['responses','codex'].includes(backend))throw Error('Unsupported execution backend');
 if(this.mode==='development'&&(provider.protocol!=='development'||provider.secret||backend==='codex'))throw Error('Development mode only runs the built-in simulator; external execution and credentials are disabled.');
 if(this.mode!=='development'&&provider.protocol==='development')throw Error('Simulated providers require development mode.');
 if(backend==='codex'&&(provider.protocol!=='responses'||provider.url!=='https://api.openai.com/v1'))throw Error('Codex uses an OpenAI provider; select your OpenAI connection.');
 const month=new Date().toISOString().slice(0,7);const used=this.store.all('runs').filter(r=>r.createdAt.startsWith(month)).reduce((n,r)=>n+(r.usage?.input_tokens||0)+(r.usage?.output_tokens||0),0);
 const reserved=[...this.active.keys()].reduce((n,id)=>{const r=this.store.get('runs',id);return n+r.maxOutput+r.contextLimit*r.maxSteps},0);if(used+reserved+settings.maxOutput+settings.contextLimit*settings.maxSteps>settings.monthlyTokens)throw Error('Monthly token guard reached. Adjust the limit in Settings.');
 const model=String(data.model||settings.model).trim();if(!model||model.length>120)throw Error('Enter a model ID');
 const reasoning=data.reasoning||settings.reasoning;if(!['low','medium','high','xhigh','max'].includes(reasoning))throw Error('Invalid reasoning effort');if(backend==='codex'&&reasoning==='max')throw Error('This pinned Codex version supports reasoning up to xhigh. Choose xhigh or lower.');
 const prompt=String(data.prompt||'').trim();if(!prompt||prompt.length>50000)throw Error('Enter a task of 1–50,000 characters.');
 const prior=conversation?this.store.all('messages').filter(m=>m.conversationId===conversation.id):[];
 const attachments=(data.fileIds||[]).map(id=>this.store.get('files',id));if(attachments.some(f=>!f||f.projectId!==project.id))throw Error('File does not belong to this project');
 const projectContext=[project.description,project.goal,project.decisions].filter(Boolean).join('\n');
 const content=prompt+(projectContext?'\n\nProject context (user-maintained):\n'+projectContext:'')+attachments.map(f=>'\n\nAttached file '+f.name+':\n'+f.content).join('');
 if(JSON.stringify(prior).length+content.length>settings.contextLimit*3)throw Error('Context limit exceeded. Start a new conversation or raise the limit.');
 if(!conversation)conversation=this.store.put('conversations',{projectId:project.id,title:prompt.slice(0,70),createdAt:new Date().toISOString()});
 const run=this.store.transaction(()=>{const r=this.store.put('runs',{...settings,id:randomUUID(),projectId:project.id,conversationId:conversation.id,providerId:provider.id,backend,model,reasoning,prompt:content,contextSnapshot:{description:project.description||'',goal:project.goal||'',decisions:project.decisions||'',fileIds:attachments.map(f=>f.id)},status:'queued',createdAt:new Date().toISOString(),usage:{input_tokens:0,output_tokens:0},cost:null,agentId:data.agentId||null});this.store.put('messages',{conversationId:conversation.id,runId:r.id,role:'user',content,createdAt:r.createdAt});return r});
 const layout=composeWorkspace(this.store,run,{fileIds:attachments.map(f=>f.id),workflowId:data.workflowId});this.emit(run.id,'workspace_composed',{layoutId:layout.id,panels:layout.panels,reason:layout.reason,policy:layout.policy});
 if(data.workflowId)this.patch(run.id,{workflowId:data.workflowId,stepId:data.stepId});
 const controller=new AbortController();const key=provider.secret?unseal(provider.secret,session.key):'';this.active.set(run.id,{controller,conversationId:conversation.id});this.execute(run,project,conversation,provider,key,controller).catch(()=>{});return run;
 }
 async execute(run,project,conversation,provider,key,controller){
 const browser=new BrowserTools(),signal=controller.signal;let timeout=setTimeout(()=>controller.abort(),run.maxDuration*1000);const seen=new Set();
 const emit=(type,data)=>this.emit(run.id,type,data);
 const message=(content,id)=>{if(id&&seen.has(id))return;if(id)seen.add(id);this.store.put('messages',{conversationId:conversation.id,runId:run.id,role:'assistant',content:String(content),createdAt:new Date().toISOString()});this.patch(run.id,{partial:''})};
 const usage=u=>{const current=this.store.get('runs',run.id);const total={input_tokens:current.usage.input_tokens+(u.input_tokens||0),output_tokens:current.usage.output_tokens+(u.output_tokens||0)};this.patch(run.id,{usage:total,cost:provider.inputRate!=null&&provider.outputRate!=null?(total.input_tokens*provider.inputRate+total.output_tokens*provider.outputRate)/1000000:null});emit('usage',u)};
 const approve=(type,data)=>this.approve(run.id,type,data,signal);
 try{
 this.patch(run.id,{status:'running',startedAt:new Date().toISOString()});emit('run_started',{backend:run.backend,model:run.model});
 const connectors=this.store.all('connectors').filter(c=>c.enabled);
 const ctx={run,project,conversation,provider,key,signal,emit,approve,usage,message,browser,connectors,agent:this.store.get('agents',run.agentId),history:this.store.all('messages').filter(m=>m.conversationId===conversation.id),codexHome:join(this.dir,'codex'),saveConversation:c=>this.store.put('conversations',c),delta:d=>{const current=this.store.get('runs',run.id);this.patch(run.id,{partial:(current.partial||'')+d})},
 executeTool:async(name,args)=>{if(signal.aborted)throw Error('Run cancelled');let a;try{a=JSON.parse(args)}catch{return {error:'Invalid tool arguments'}};if(name==='compose_workspace'){try{const layout=reshapeWorkspace(this.store,'layout-'+run.conversationId,a);emit('workspace_adapted',{layoutId:layout.id,panels:layout.panels,reason:layout.reason});return {layoutId:layout.id,panels:layout.panels,permissions:'Unchanged; read-only surfaces only'}}catch(e){emit('workspace_rejected',{error:e.message});return {error:e.message}}}if(!['create_artifact','browser_action'].includes(name))return {error:'Unknown tool'};
 if(name==='browser_action'&&!run.browser)return {error:'Browser tool is disabled'};
 if(!await approve(name,a))return {error:'User declined this action'};if(signal.aborted)throw Error('Run cancelled');
 emit('tool_started',{name,arguments:a});try{const result=name==='create_artifact'?await this.artifact(run,a.name,String(a.content)):await browser.action(a);emit('tool_completed',{name,result});return result}catch(e){emit('tool_failed',{name,error:e.message});return {error:e.message}}}};
 if(this.mode==='development')this.patch(run.id,{simulated:true,cost:0});
 await mkdir(project.path,{recursive:true});await mkdir(ctx.codexHome,{recursive:true});if(this.mode==='development')await runDevelopment(ctx);else if(run.backend==='codex')await runCodex(ctx);else await runResponses(ctx);
 if(signal.aborted)throw Error('Run cancelled');if(run.backend==='codex')await this.collectCodeArtifacts(run,project);this.patch(run.id,{status:'completed',endedAt:new Date().toISOString()});emit('run_completed',{});
 }catch(e){const status=signal.aborted?'cancelled':'failed';this.patch(run.id,{status,error:e.message,endedAt:new Date().toISOString()});emit('run_'+status,{error:e.message})}
 finally{clearTimeout(timeout);await browser.close().catch(()=>{});this.active.delete(run.id);}
 }
}
