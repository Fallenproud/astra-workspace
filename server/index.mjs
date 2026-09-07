import {promoteWorkspace,reshapeWorkspace} from './workspace-composer.mjs';
import {saveWorkflowTemplate} from './workflow-templates.mjs';
import express from 'express';
import {join,resolve,dirname} from 'node:path';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Store} from './store.mjs';
import {Vault,seal,unseal,text,bounded,validateEndpoint} from './security.mjs';
import {Engine,defaults} from './engine.mjs';
import {CodexClient} from './codex.mjs';
import {SkillsRegistry} from './skills.mjs';import {Diagrams} from './diagrams.mjs';import {Workflows} from './workflows.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function createApp({mode=process.env.ASTRA_MODE||'development',dataDir,port=Number(process.env.PORT||4317),test=false}={}){
 if(test)mode='test';
 if(!['development','production','test'].includes(mode))throw Error('Invalid ASTRA_MODE');
 const development=mode==='development';
 dataDir=dataDir||process.env.ASTRA_DATA_DIR||join(root,development?'.data-development':'.data');
 const store=new Store(dataDir);
 const previousMode=store.get('system','runtime-mode')?.mode;
 if((previousMode&&previousMode!==mode)||(development&&store.all('providers').some(p=>p.secret))){store.close();throw Error('Use a separate data directory for each runtime mode.');}
 store.put('system',{id:'runtime-mode',mode});
 if(development){store.put('providers',{id:'development-provider',name:'Development simulator',protocol:'development',url:'internal://development',models:['astra-development'],status:'simulated'});if(!store.get('system','settings'))store.put('system',{...defaults,providerId:'development-provider',model:'astra-development'});}
 const vault=new Vault(store),engine=new Engine(store,dataDir,{mode}),app=express();
 const diagrams=new Diagrams(store,dataDir),skills=new SkillsRegistry(store,engine,diagrams,mode),workflows=new Workflows(store,engine);await skills.initialize();
 app.disable('x-powered-by');
 app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"});const host=req.headers.host;if(!['127.0.0.1:'+port,'localhost:'+port].includes(host))return res.status(403).json({error:'Invalid host'});const origin=req.headers.origin;if(origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(origin))return res.status(403).json({error:'Cross-origin requests are blocked'});next()});
 app.use(express.json({limit:'2mb'}));
 app.get('/api/auth/status',(req,res)=>res.json({mode,configured:vault.configured,unlocked:!!vault.session(req)}));
 app.post('/api/auth/unlock',(req,res)=>{try{if(development&&req.body.passphrase)throw Error('Development mode accepts no passphrases or secrets.');const token=vault.login(development?'astra-public-development-only':req.body.passphrase);res.cookie('astra_session',token,{httpOnly:true,sameSite:'strict',maxAge:12*3600000,path:'/'}).json({ok:true})}catch(e){res.status(401).json({error:e.message})}});
 app.use('/api',(req,res,next)=>{req.session=vault.session(req);if(!req.session)return res.status(401).json({error:'Unlock your workspace first'});next()});
 app.post('/api/auth/lock',(req,res)=>{for(const id of workflows.active.keys())workflows.cancel(id);for(const id of engine.active.keys())engine.cancel(id);vault.lock();res.clearCookie('astra_session').json({ok:true})});
 app.use('/api',(req,res,next)=>{if(development&&(req.path.startsWith('/providers')||req.path.startsWith('/connectors'))&&req.method!=='GET')return res.status(403).json({error:'Development mode disables provider credentials and external connections. Use the built-in simulator.'});next()});
 const publicProvider=({secret,...p})=>({...p,hasKey:!!secret});
 app.get('/api/state',(req,res)=>res.json({projects:store.all('projects'),conversations:store.all('conversations'),runs:store.all('runs'),messages:store.all('messages'),artifacts:store.all('artifacts').map(({path,...a})=>a),files:store.all('files').map(({content,...f})=>f),providers:store.all('providers').map(publicProvider),connectors:store.all('connectors'),agents:store.all('agents'),approvals:store.all('approvals'),settings:{...defaults,...store.get('system','settings')},workspaceLayouts:store.all('workspace-layouts'),workspaceTemplates:store.all('workspace-templates'),workflowTemplates:store.all('workflow-templates'),workflows:store.all('workflows'),diagrams:store.all('diagrams').map(d=>diagrams.public(d)),status:{mode,storage:'SQLite · WAL',activeRuns:engine.active.size,localOnly:true,codexVersion:'0.107.0'}}));
 app.get('/api/skills',(req,res)=>res.json(skills.catalog()));
 app.post('/api/skills/refresh',async(req,res)=>res.json(await skills.sync()));
 app.get('/api/skills/:id',(req,res)=>res.json(skills.detail(req.params.id)));
 app.post('/api/skills/:id/activation',(req,res)=>res.json(skills.activate(req.params.id,req.body.enabled)));
 app.post('/api/skills/:id/invoke',async(req,res)=>res.status(201).json(await skills.invoke(req.params.id,req.body)));
 app.post('/api/workspace-layouts/:id/template',(req,res)=>{const t=store.get('workspace-templates',req.body.templateId);if(!t)throw Error('Workspace template not found');const l=reshapeWorkspace(store,req.params.id,{panels:t.panels,reason:'User applied saved layout: '+t.name});engine.emit(l.runId,'workspace_adapted',{layoutId:l.id,panels:l.panels,reason:l.reason});res.json(l)});
 app.post('/api/workspace-layouts/:id/promote',(req,res)=>{const t=promoteWorkspace(store,req.params.id);const layout=store.get('workspace-layouts',req.params.id);engine.emit(layout.runId,'workspace_template_saved',{templateId:t.id,layoutId:layout.id});res.status(201).json(t)});
 app.post('/api/workflow-templates',(req,res)=>res.status(201).json(saveWorkflowTemplate(store,req.body)));
 app.post('/api/workflows',(req,res)=>res.status(202).json(workflows.start(req.body,req.session)));
 app.post('/api/workflows/:id/cancel',(req,res)=>{workflows.cancel(req.params.id);res.json({ok:true})});
 app.post('/api/workflows/:id/diagram',async(req,res)=>{const w=store.get('workflows',req.params.id);if(!w)return res.sendStatus(404);res.json(await diagrams.render({title:w.name,projectId:w.projectId,steps:[{label:'Start'},...w.steps.map(s=>({label:s.agentName})),{label:'Finish'}]}))});
 app.get('/api/diagrams/:id/content',async(req,res)=>{const d=store.get('diagrams',req.params.id);if(!d)return res.sendStatus(404);res.set('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; sandbox allow-scripts allow-downloads");res.type('html').send(await readFile(d.path))});
 app.get('/api/diagrams/:id/receipt',(req,res)=>{const d=store.get('diagrams',req.params.id);if(!d)return res.sendStatus(404);res.json(diagrams.public(d))});
 app.post('/api/projects',async(req,res)=>{const p=store.put('projects',{name:text(req.body.name,80),description:String(req.body.description||'').slice(0,500),createdAt:new Date().toISOString()});p.path=join(resolve(dataDir),'projects',p.id);await mkdir(p.path,{recursive:true});store.put('projects',p);res.status(201).json(p)});
 app.patch('/api/projects/:id',(req,res)=>{const p=store.get('projects',req.params.id);if(!p)return res.sendStatus(404);res.json(store.put('projects',{...p,name:req.body.name===undefined?p.name:text(req.body.name,80),description:req.body.description===undefined?p.description:String(req.body.description).slice(0,500),goal:req.body.goal===undefined?p.goal:String(req.body.goal).slice(0,2000),decisions:req.body.decisions===undefined?p.decisions:String(req.body.decisions).slice(0,8000),updatedAt:new Date().toISOString()}))});
 app.post('/api/providers',(req,res)=>{const protocol=req.body.protocol;if(!['responses','chat'].includes(protocol))throw Error('Choose Responses API or Chat Completions');const url=validateEndpoint(req.body.url,{local:true});const key=String(req.body.apiKey||'');if(key.length>4096)throw Error('API key too long');if(!key&&!url.startsWith('http://'))throw Error('Enter an API key for a remote provider');const rate=v=>{if(v===''||v==null)return null;const n=Number(v);if(!Number.isFinite(n)||n<0||n>100000)throw Error('Invalid token rate');return n};
 const p=store.put('providers',{name:text(req.body.name,60),protocol,url,secret:key?seal(key,req.session.key):null,inputRate:rate(req.body.inputRate),outputRate:rate(req.body.outputRate),status:'untested',models:[],createdAt:new Date().toISOString()});
 const settings={...defaults,...store.get('system','settings')};if(!settings.providerId)store.put('system',{...settings,providerId:p.id});res.status(201).json(publicProvider(p))});
 app.delete('/api/providers/:id',(req,res)=>{if([...engine.active.keys()].some(id=>store.get('runs',id).providerId===req.params.id))throw Error('Wait for active provider runs before disconnecting');store.remove('providers',req.params.id);res.json({ok:true})});
 app.post('/api/providers/:id/test',async(req,res)=>{const p=store.get('providers',req.params.id);if(!p)return res.sendStatus(404);const key=p.secret?unseal(p.secret,req.session.key):'';let status='error',models=[],error;
 try{const response=await fetch(p.url+'/models',{headers:key?{Authorization:'Bearer '+key}:{},signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)throw Error('Provider returned HTTP '+response.status);const data=await response.json();models=(data.data||[]).map(x=>x.id).filter(x=>typeof x==='string').slice(0,400);status='connected'}catch(e){error=e.message}
 const updated=store.put('providers',{...p,status,models,lastChecked:new Date().toISOString(),error});res.json(publicProvider(updated))});
 app.post('/api/connectors',(req,res)=>res.status(201).json(store.put('connectors',{name:text(req.body.name,40),url:validateEndpoint(req.body.url),enabled:false,createdAt:new Date().toISOString()})));
 app.patch('/api/connectors/:id',(req,res)=>{const c=store.get('connectors',req.params.id);if(!c)return res.sendStatus(404);res.json(store.put('connectors',{...c,enabled:!!req.body.enabled}))});
 app.delete('/api/connectors/:id',(req,res)=>{store.remove('connectors',req.params.id);res.json({ok:true})});
 app.post('/api/agents',(req,res)=>res.status(201).json(store.put('agents',{name:text(req.body.name,60),instructions:text(req.body.instructions,10000),createdAt:new Date().toISOString()})));
 app.delete('/api/agents/:id',(req,res)=>{store.remove('agents',req.params.id);res.json({ok:true})});
 app.put('/api/settings',(req,res)=>{const b=req.body;res.json(store.put('system',{...defaults,id:'settings',providerId:String(b.providerId||''),model:text(b.model,120),reasoning:['low','medium','high','xhigh','max'].includes(b.reasoning)?b.reasoning:'high',backend:b.backend==='codex'?'codex':'responses',maxOutput:bounded(b.maxOutput,256,128000,8192),contextLimit:bounded(b.contextLimit,1000,1050000,32000),maxSteps:bounded(b.maxSteps,1,20,8),maxDuration:bounded(b.maxDuration,30,3600,300),monthlyTokens:bounded(b.monthlyTokens,1000,100000000,1000000),webSearch:!!b.webSearch,browser:!!b.browser}))});
 app.post('/api/files',async(req,res)=>{const project=store.get('projects',req.body.projectId);if(!project)throw Error('Choose a project');const name=text(req.body.name,200).replace(/[^a-zA-Z0-9._-]/g,'_');const content=String(req.body.content||'');if(content.length>200000)throw Error('Text files must be at most 200 KB');const f=store.put('files',{projectId:project.id,name,content,size:Buffer.byteLength(content),createdAt:new Date().toISOString()});await mkdir(join(project.path,'inputs'),{recursive:true});await writeFile(join(project.path,'inputs',f.id+'-'+name),content);const {content:_,...meta}=f;res.status(201).json(meta)});
 app.get('/api/files/:id',(req,res)=>{const f=store.get('files',req.params.id);if(!f)return res.sendStatus(404);res.type('text/plain').send(f.content)});
 app.post('/api/runs',(req,res)=>res.status(202).json(engine.start(req.body,req.session)));
 app.post('/api/runs/:id/cancel',(req,res)=>{engine.cancel(req.params.id);res.json({ok:true})});
 app.get('/api/runs/:id/events',(req,res)=>res.json(store.all('events').filter(e=>e.runId===req.params.id)));
 app.get('/api/runs/:id/export',(req,res)=>{const run=store.get('runs',req.params.id);if(!run)return res.sendStatus(404);res.attachment('astra-run-'+run.id+'.json').json({run,events:store.all('events').filter(e=>e.runId===run.id),approvals:store.all('approvals').filter(a=>a.runId===run.id)})});
 app.post('/api/approvals/:id',(req,res)=>{if(typeof req.body.approved!=='boolean')throw Error('Explicit approval decision required');engine.decide(req.params.id,req.body.approved);res.json({ok:true})});
 app.post('/api/inputs/:id',(req,res)=>{engine.answer(req.params.id,req.body.answers);res.json({ok:true})});
 app.get('/api/artifacts/:id',async(req,res)=>{const a=store.get('artifacts',req.params.id);if(!a)return res.sendStatus(404);res.attachment(a.name).send(await readFile(a.path))});
 app.get('/api/export',(req,res)=>res.attachment('astra-workspace.json').json({version:1,exportedAt:new Date().toISOString(),projects:store.all('projects'),conversations:store.all('conversations'),messages:store.all('messages'),runs:store.all('runs'),events:store.all('events'),approvals:store.all('approvals'),files:store.all('files'),agents:store.all('agents'),workspaceLayouts:store.all('workspace-layouts'),workspaceTemplates:store.all('workspace-templates'),workflowTemplates:store.all('workflow-templates'),workflows:store.all('workflows'),diagrams:store.all('diagrams').map(d=>diagrams.public(d)),skillInvocations:store.all('skill-invocations'),skillActivations:store.all('skill-activations'),registry:store.get('system','skill-registry'),settings:store.get('system','settings')}));
 if(existsSync(join(root,'dist/index.html'))){app.use(express.static(join(root,'dist')));app.get('/{*path}',(req,res)=>res.sendFile(join(root,'dist/index.html')))}
 else if(!test){const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'spa'});app.use(vite.middlewares)}
 app.use((err,req,res,next)=>res.status(400).json({error:err.message||'Request failed'}));
 return {app,store,vault,engine,skills,diagrams,workflows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||4317);const runtime=await createApp({port});const server=runtime.app.listen(port,'127.0.0.1',()=>console.log('Astra Workspace: http://127.0.0.1:'+port));server.on('error',e=>{console.error(e.message);process.exitCode=1});for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{for(const id of runtime.workflows.active.keys())runtime.workflows.cancel(id);for(const id of runtime.engine.active.keys())runtime.engine.cancel(id);server.close(()=>{runtime.store.close();process.exit()})})}
