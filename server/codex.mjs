import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleBackendRequest} from './requests.mjs';
export class CodexClient {
 constructor({home,key,onEvent,onRequest}){this.seq=0;this.pending=new Map();const bin=fileURLToPath(new URL('../node_modules/@openai/codex/bin/codex.js',import.meta.url));this.process=spawn(process.execPath,[bin,'app-server','-c','model_provider="astra"','-c','model_providers.astra={name="OpenAI via Astra",base_url="https://api.openai.com/v1",env_key="OPENAI_API_KEY",wire_api="responses"}'],{windowsHide:true,env:{...Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|pathext|systemroot|windir|comspec|temp|tmp|userprofile|home|appdata|localappdata|programfiles|programfiles\(x86\)|programdata|systemdrive|username|number_of_processors|processor_architecture)$/i.test(k))),CODEX_HOME:home,OPENAI_API_KEY:key||''},stdio:['pipe','pipe','pipe']});this.process.stderr.on('data',()=>{});createInterface({input:this.process.stdout}).on('line',l=>{try{const m=JSON.parse(l);if(m.id!==undefined&&!m.method){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}}else if(m.id!==undefined){Promise.resolve(onRequest?.(m)).then(result=>this.send({id:m.id,result:result??{decision:'decline'}})).catch(()=>this.send({id:m.id,error:{code:-32603,message:'Request declined by Astra'}}))}else onEvent?.(m)}catch{}});const fail=e=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(e)}this.pending.clear();onEvent?.({method:'astra/transportClosed',params:{message:e.message}})};this.process.on('error',fail);this.process.on('exit',c=>fail(Error('Codex app-server exited ('+c+')')));}
 send(v){if(!this.process.stdin.destroyed)this.process.stdin.write(JSON.stringify(v)+'\n')}
 rpc(method,params={}){return new Promise((resolve,reject)=>{const id=++this.seq;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Codex request timed out: '+method))},30000);this.pending.set(id,{resolve,reject,timer});this.send({id,method,params})})}
 async initialize(){const r=await this.rpc('initialize',{clientInfo:{name:'astra_workspace',title:'Astra Workspace',version:'0.1.0'}});this.send({method:'initialized',params:{}});return r}
 close(){this.process.kill()}
}
export async function runCodex(ctx){
 const {run,conversation,project,key,emit,approve,signal,saveConversation}=ctx;let lastTokens={input_tokens:0,output_tokens:0};
 let turnId,client,done=false,resolveDone,rejectDone;const complete=new Promise((r,j)=>{resolveDone=r;rejectDone=j});complete.catch(()=>{});
 const abort=()=>{if(turnId)client.rpc('turn/interrupt',{threadId:conversation.codexThreadId,turnId}).catch(()=>{});rejectDone(Error('Run cancelled'));setTimeout(()=>client.close(),1000).unref()};
 client=new CodexClient({home:ctx.codexHome,key,onEvent:m=>{
 if(m.method==='astra/transportClosed'&&!done)rejectDone(Error(m.params.message));
 if(m.method==='item/agentMessage/delta')ctx.delta(m.params.delta);
 if(m.method==='thread/tokenUsage/updated'){const u=m.params.tokenUsage?.last||{};const next={input_tokens:u.inputTokens||0,output_tokens:u.outputTokens||0};ctx.usage({input_tokens:Math.max(0,next.input_tokens-lastTokens.input_tokens),output_tokens:Math.max(0,next.output_tokens-lastTokens.output_tokens)});lastTokens=next}
 if(m.method==='item/completed'&&m.params.item?.type==='agentMessage')ctx.message(m.params.item.text,m.params.item.id);
 if(['turn/plan/updated','turn/diff/updated','item/started','item/completed','error'].includes(m.method)){const item=m.params?.item; if(item?.type==='reasoning')return;emit(m.method,m.params)}
 if(m.method==='turn/completed'){done=true;m.params.turn.status==='completed'?resolveDone():rejectDone(Error(m.params.turn.error?.message||m.params.turn.status))}
 },onRequest:m=>handleBackendRequest({approve,emit},m)});
 signal.addEventListener('abort',abort,{once:true});
 try{await client.initialize();if(signal.aborted)throw Error('Run cancelled');
 // Environment credentials are inherited in memory, never written using account/login/start.
 const p={cwd:project.path,model:run.model,modelProvider:'astra',approvalPolicy:'untrusted',sandbox:'workspace-write',developerInstructions:ctx.agent?.instructions||null};
 // Wire enums are verified against the pinned CLI schema: kebab-case.
 const thread=await client.rpc(conversation.codexThreadId?'thread/resume':'thread/start',{...p,...(conversation.codexThreadId?{threadId:conversation.codexThreadId}:{})});
 conversation.codexThreadId=thread.thread.id;saveConversation(conversation);emit('sandbox_status',{requested:'workspace-write',actual:thread.sandbox?.type||'unknown'});if(thread.sandbox?.type==='readOnly')emit('sandbox_restricted',{message:'Codex returned read-only access on this host. File changes may require additional sandbox setup or approval.'});
 const t=await client.rpc('turn/start',{threadId:thread.thread.id,input:[{type:'text',text:run.prompt}],model:run.model,effort:run.reasoning});
 turnId=t.turn.id;emit('backend_started',{backend:'codex',threadId:thread.thread.id,turnId});await complete;
 }finally{done=true;signal.removeEventListener('abort',abort);client.close()}
}
