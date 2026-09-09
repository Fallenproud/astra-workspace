import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Store} from '../server/store.mjs';
import {Engine} from '../server/engine.mjs';
import {snapshotG2, verifyG2Filesystem} from '../server/g2-verification.mjs';

const id='g2-'+randomUUID().slice(0,8);
const evidence=resolve('work/runtime-readiness',id);
const root=join('D:\\AstraRuntimeCanary',id,'project');
await mkdir(join(root,'src'),{recursive:true});await mkdir(evidence,{recursive:true});
await writeFile(join(root,'README.md'),'Astra G2 fixture. This file must remain unchanged.\n');
await writeFile(join(root,'src/value.txt'),'ASTRA_G2_BEFORE');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
git('init','--quiet');git('add','README.md','src/value.txt');
git('-c','user.name=Astra G2 Verifier','-c','user.email=astra-verifier@example.invalid','commit','--quiet','-m','G2 fixture baseline');
const baseline=await snapshotG2(root), revision=git('rev-parse','HEAD');
await writeFile(join(evidence,'baseline.json'),JSON.stringify({revision,files:baseline},null,2));
// Deliberately different expectation against an unchanged fixture: no model or repair.
const negative=await verifyG2Filesystem({root,baseline,expected:'ASTRA_G2_EXPECTED'});
await writeFile(join(evidence,'negative-verification.json'),JSON.stringify(negative,null,2));
const store=new Store(join(evidence,'control-plane-probe'));
const engine=new Engine(store,join(evidence,'control-plane-probe'),{mode:'development'});
store.put('projects',{id:'fixture',name:'G2 admission fixture',path:root});
store.put('providers',{id:'simulator',name:'Development simulator',protocol:'development'});
let admissionError=null;
try {engine.start({projectId:'fixture',providerId:'simulator',backend:'codex',prompt:'Change the complete contents of src/value.txt from ASTRA_G2_BEFORE to ASTRA_G2_AFTER. Do not modify any other file.'},{});}
catch(error){admissionError=error.message;}
const runsCreated=store.all('runs').length;store.close();
const diff=git('diff','HEAD','--');await writeFile(join(evidence,'diff.patch'),diff);
const after=await snapshotG2(root);
const code=await readFile(new URL('../server/codex.mjs',import.meta.url));
const receipt={id,gate:'G2',result:'FAIL',stage:'preflight',createdAt:new Date().toISOString(),
  workspace:root,baselineRevision:revision,baseline,after,targetContent:await readFile(join(root,'src/value.txt'),'utf8'),
  changedFiles:Object.keys(after).filter(k=>after[k]!==baseline[k]),
  backendStarted:false,sandbox:null,actualSandboxMode:null,threadId:null,turnId:null,
  admission:{mode:'development',error:admissionError,runsCreated},
  codeEvidence:{codexAdapterSha256:createHash('sha256').update(code).digest('hex'),transport:'Current CodexClient spawns host Node directly; no Sandboxie RuntimeAdapter binding exists.'},
  negativeVerifier:negative.result,
  approvals:[],runtimeEvents:[],processOutcome:'not_launched',
  boundary:{prohibitedWriteAttempted:false,liveBoundaryVerified:false,fixtureUnchanged:JSON.stringify(baseline)===JSON.stringify(after)},
  cleanup:{processesStarted:false,sandboxCreated:false,evidenceRetained:true,fixtureRetained:true},
  blockers:['Actual Codex integration has no Sandboxie transport binding.','Development control-plane admission rejects Codex; no live provider execution attempted.','Engine completion currently follows backend completion without a G2 verification-receipt gate.'],
  G3:'NOT_STARTED'};
await writeFile(join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));
await writeFile(resolve('work/runtime-readiness/G2-summary.json'),JSON.stringify({G0:'PASS',G1:'PASS',G2:'FAIL',receipt:id+'/receipt.json',negative:id+'/negative-verification.json',diff:id+'/diff.patch'},null,2));
console.log(JSON.stringify({evidence,...receipt},null,2));
