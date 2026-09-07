import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
const vendor=fileURLToPath(new URL('../vendor/archify/',import.meta.url));
const digest=value=>createHash('sha256').update(value).digest('hex');
export function workflowSpec(title,steps){
 if(!Array.isArray(steps)||steps.length<2||steps.length>12)throw Error('Use 2–12 workflow nodes.');
 const nodes=steps.map((s,i)=>({id:'step'+i,lane:'runtime',col:i,type:'backend',label:String(s.label||s.name||'Step '+(i+1)).slice(0,45)}));
 return {schema_version:2,diagram_type:'workflow',meta:{title:String(title||'Astra workflow').slice(0,90),quality_profile:'showcase'},lanes:[{id:'runtime',label:'Astra workflow'}],mainPath:nodes.map(n=>n.id),nodes,edges:nodes.slice(1).map((n,i)=>({id:'edge'+i,from:nodes[i].id,to:n.id}))};
}
export function parseMermaid(source){
 const lines=String(source).split(/[\n;]/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('%%'));
 if(!/^(flowchart|graph)\s+(LR|TD|TB)$/.test(lines.shift()||''))throw Error('Use a Mermaid flowchart LR/TD with named nodes and plain or labeled arrows.');
 const nodes=new Map(),edges=[];
 const node=s=>{const m=s.trim().match(/^([A-Za-z][\w-]*)(?:\[([^\]<>]{1,45})\]|\{([^{}<>]{1,45})\})?$/);if(!m)throw Error('Unsupported Mermaid node syntax. Use ID[Label] or ID{Decision}.');const previous=nodes.get(m[1]);nodes.set(m[1],{id:m[1],label:m[2]||m[3]||previous?.label||m[1],type:m[3]?'security':previous?.type||'backend'});return m[1]};
 for(const line of lines){const m=line.match(/^(.*?)\s*-->\s*(?:\|([^|<>]{1,35})\|\s*)?(.*?)$/);if(!m){node(line);continue;}edges.push({id:'edge'+edges.length,from:node(m[1]),to:node(m[3]),...(m[2]?{label:m[2]}:{})});}
 if(nodes.size<2||nodes.size>12||edges.length>20)throw Error('Use 2–12 nodes and at most 20 edges.');
 const indegree=new Map([...nodes.keys()].map(id=>[id,0])),depth=new Map([...nodes.keys()].map(id=>[id,0]));
 for(const e of edges)indegree.set(e.to,indegree.get(e.to)+1);
 const queue=[...nodes.keys()].filter(id=>indegree.get(id)===0),order=[];
 while(queue.length){const id=queue.shift();order.push(id);for(const e of edges.filter(e=>e.from===id)){depth.set(e.to,Math.max(depth.get(e.to),depth.get(id)+1));indegree.set(e.to,indegree.get(e.to)-1);if(indegree.get(e.to)===0)queue.push(e.to);}}
 if(order.length!==nodes.size)throw Error('Cyclic Mermaid requires a lifecycle adapter; no edges were discarded.');
 const used=new Map();let lanes=1;
 const result=order.map(id=>{const col=depth.get(id),row=used.get(col)||0;used.set(col,row+1);lanes=Math.max(lanes,row+1);return {...nodes.get(id),col,lane:'flow'+row}});
 return {schema_version:2,diagram_type:'workflow',meta:{title:'Mermaid workflow',quality_profile:'showcase'},lanes:Array.from({length:lanes},(_,i)=>({id:'flow'+i,label:i?'Branch '+i:'Main flow'})),nodes:result,edges};
}
export class Diagrams{
 constructor(store,dir){this.store=store;this.dir=dir;this.active=false;}
 async render({source,title,steps,projectId,skill}){
  if(this.active)throw Error('A diagram is already rendering.');
  const spec=steps?workflowSpec(title,steps):parseMermaid(source);
  const id=randomUUID(),dir=join(this.dir,'diagrams',id);
  this.active=true;
  try{
   await mkdir(dir,{recursive:true});
   const input=join(dir,'source.json'),output=join(dir,'diagram.html');
   await writeFile(input,JSON.stringify(spec,null,2));
   let receipt;
   try{const {stdout}=await exec(process.execPath,[join(vendor,'bin/archify.mjs'),'deliver','workflow',input,output,'--quality','showcase','--json'],{cwd:vendor,timeout:45000,maxBuffer:2e6,windowsHide:true,env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,TEMP:process.env.TEMP}});receipt=JSON.parse(stdout);}
   catch(e){throw Error('Archify validation failed; previous diagrams preserved. '+String(e.stdout||e.message).slice(0,1400));}
   if(!receipt.ok)throw Error('Archify did not validate the candidate');
   const html=await readFile(output);const record={id,projectId:projectId||null,title:spec.meta.title,type:'workflow',path:output,spec,receipt,skill,sourceDigest:digest(JSON.stringify(spec)),artifactDigest:digest(html),browserVerified:false,createdAt:new Date().toISOString()};
   this.store.put('diagrams',record);return this.public(record);
  }finally{this.active=false;}
 }
 public({path,...record}){return record;}
}
