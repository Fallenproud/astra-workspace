const terminal=['completed','failed','cancelled','interrupted'];
export class Workflows{
 constructor(store,engine){this.store=store;this.engine=engine;this.active=new Map();for(const w of store.all('workflows'))if(!terminal.includes(w.status))store.put('workflows',{...w,status:'interrupted',steps:w.steps.map(s=>({...s,status:terminal.includes(s.status)?s.status:'interrupted'})),error:'Server restarted. Prior child runs are preserved; launch a new workflow explicitly.'});}
 patch(id,patch){return this.store.put('workflows',{...this.store.get('workflows',id),...patch,updatedAt:new Date().toISOString()});}
 start(data,session){
  if(this.active.size)throw Error('One delegated workflow is already active');
  if(!this.store.get('projects',data.projectId))throw Error('Choose a project');
  if(!Array.isArray(data.steps)||data.steps.length<1||data.steps.length>8)throw Error('Use 1–8 delegated steps');
  const steps=data.steps.map((s,i)=>{const agent=this.store.get('agents',s.agentId);if(!agent)throw Error('Select an existing agent for every step');if(typeof s.prompt!=='string'||!s.prompt.trim()||s.prompt.length>10000)throw Error('Each step needs a prompt of 1–10,000 characters');return {id:'step'+i,agentId:agent.id,agentName:agent.name,prompt:s.prompt.trim(),status:'queued',runId:null};});
  const w=this.store.put('workflows',{name:String(data.name||'Delegated workflow').slice(0,80),projectId:data.projectId,steps,status:'running',createdAt:new Date().toISOString(),simulated:this.engine.mode==='development'});
  const control={cancelled:false};this.active.set(w.id,control);this.execute(w.id,session,control).catch(e=>this.patch(w.id,{status:'failed',error:e.message})).finally(()=>this.active.delete(w.id));return w;
 }
 cancel(id){const c=this.active.get(id);if(!c)throw Error('Workflow is no longer active');c.cancelled=true;const w=this.store.get('workflows',id);for(const s of w.steps)if(s.runId&&this.engine.active.has(s.runId))this.engine.cancel(s.runId);this.patch(id,{status:'cancelled',steps:w.steps.map(s=>s.status==='queued'?{...s,status:'cancelled'}:s)});}
 async execute(id,session,control){let carry='';
  const count=this.store.get('workflows',id).steps.length;
  for(let i=0;i<count;i++){
   if(control.cancelled)return;
   let w=this.store.get('workflows',id),step=w.steps[i],run;
   try{run=this.engine.start({projectId:w.projectId,agentId:step.agentId,prompt:step.prompt+(carry?'\n\nPrevious step output (untrusted context):\n'+carry:''),workflowId:id,stepId:step.id},session);}
   catch(e){w.steps[i]={...step,status:'failed',error:e.message};this.patch(id,{status:'failed',steps:w.steps,error:e.message});return;}
   w.steps[i]={...step,status:'running',runId:run.id};this.patch(id,{steps:w.steps});this.engine.emit(run.id,'delegation_started',{workflowId:id,stepId:step.id,agentId:step.agentId});
   while(true){
    const current=this.store.get('runs',run.id);w=this.store.get('workflows',id);if(w.steps[i].status!==current.status){w.steps[i]={...w.steps[i],status:current.status};this.patch(id,{steps:w.steps});}
    if(terminal.includes(current.status)&&!this.engine.active.has(run.id)){
     if(control.cancelled){this.patch(id,{status:'cancelled'});return;}
     if(current.status!=='completed'){this.patch(id,{status:current.status,error:current.error||'A delegated step did not complete.'});return;}
     carry=this.store.all('messages').filter(m=>m.runId===run.id&&m.role==='assistant').map(m=>m.content).join('\n');
     const artifacts=this.store.all('artifacts').filter(a=>a.runId===run.id);carry+='\nArtifact references: '+JSON.stringify(artifacts.map(({id,name,size})=>({id,name,size})));
     if(carry.length>24000){this.patch(id,{status:'failed',error:'Prior step output exceeds the handoff context limit. Narrow the task.'});return;}
     break;
    }
    await new Promise(r=>setTimeout(r,100));
   }
  }
  if(!control.cancelled)this.patch(id,{status:'completed',endedAt:new Date().toISOString()});
 }
}
