export function saveWorkflowTemplate(store,data){
 if(!data||typeof data.name!=='string'||!data.name.trim()||data.name.length>80)throw Error('Template needs a name of 1–80 characters');
 if(!Array.isArray(data.steps)||data.steps.length<1||data.steps.length>8)throw Error('Use 1–8 delegated steps');
 const steps=data.steps.map(s=>{if(!store.get('agents',s.agentId))throw Error('Select an existing agent for every step');if(typeof s.prompt!=='string'||!s.prompt.trim()||s.prompt.length>10000)throw Error('Each step needs a task of 1–10,000 characters');return {agentId:s.agentId,prompt:s.prompt.trim()}});
 return store.put('workflow-templates',{name:data.name.trim(),steps,createdAt:new Date().toISOString()});
}
