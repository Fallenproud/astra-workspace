export class AstraClient {
 constructor(baseURL='http://127.0.0.1:4317'){this.baseURL=baseURL;this.cookie=''}
 async request(path,body,method=body?'POST':'GET'){const r=await fetch(this.baseURL+'/api'+path,{method,headers:{'Content-Type':'application/json',...(this.cookie?{Cookie:this.cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const cookie=r.headers.get('set-cookie');if(cookie)this.cookie=cookie.split(';')[0];const data=await r.json();if(!r.ok)throw Error(data.error||r.statusText);return data}
 unlock(passphrase){return this.request('/auth/unlock',{passphrase})}
 state(){return this.request('/state')}
 createProject(name,description=''){return this.request('/projects',{name,description})}
 run({projectId,prompt,...options}){return this.request('/runs',{projectId,prompt,...options})}
 events(runId){return this.request('/runs/'+runId+'/events')}
 approve(approvalId,approved){return this.request('/approvals/'+approvalId,{approved})}
 answer(requestId,answers){return this.request('/inputs/'+requestId,{answers})}
 cancel(runId){return this.request('/runs/'+runId+'/cancel',{})}
 skills(){return this.request('/skills')}
 skill(id){return this.request('/skills/'+encodeURIComponent(id))}
 activateSkill(id,enabled){return this.request('/skills/'+encodeURIComponent(id)+'/activation',{enabled})}
 invokeSkill(id,input){return this.request('/skills/'+encodeURIComponent(id)+'/invoke',input)}
 workflow(input){return this.request('/workflows',input)}
 cancelWorkflow(id){return this.request('/workflows/'+encodeURIComponent(id)+'/cancel',{})}
 lock(){return this.request('/auth/lock',{})}
}
