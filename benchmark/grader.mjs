import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {bank} from './tasks.mjs';
export const IMAGE='node@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9';
export const sha=text=>createHash('sha256').update(text).digest('hex');
const directory=fileURLToPath(new URL('./',import.meta.url));
const frozenFiles=['protocol.json','tasks.mjs','grader.mjs','runtime.mjs','../mentor/policy.mjs','../mentor/model.json','../mentor/local-model.mjs','../mentor/model-assets.json','../scripts/grade-benchmark.mjs','../scripts/report-study.mjs','../scripts/allocate-study.mjs','../scripts/benchmark-freeze.mjs','../server.mjs','../public/assessment.js','../public/assessment.html','../package-lock.json'];
export async function fingerprint(){
 const files={};for(const file of frozenFiles)files[file]=sha(await readFile(path.join(directory,file)));
 return {files,bankHash:sha(JSON.stringify(files))};
}
export async function verifyFreeze(){
 const actual=await fingerprint(),frozen=JSON.parse(await readFile(path.join(directory,'frozen.json'),'utf8'));
 if(actual.bankHash!==frozen.bankHash)throw Error('Benchmark changed after freezing. Create a new version before scoring.');
 return frozen;
}
function docker(args,{input='',deadline=8000,limit=32768}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn('docker',args,{stdio:['pipe','pipe','pipe']});let stdout='',stderr='',bytes=0,reason=null;
  const timer=setTimeout(()=>{reason='timeout';child.kill('SIGKILL')},deadline);
  const collect=stream=>data=>{bytes+=data.length;if(bytes>limit){reason='output-limit';child.kill('SIGKILL');return;}if(stream==='out')stdout+=data;else stderr+=data};
  child.stdout.on('data',collect('out'));child.stderr.on('data',collect('err'));child.stdin.on('error',()=>{});child.stdin.end(input);
  child.on('error',error=>{clearTimeout(timer);reject(error)});
  child.on('close',exitCode=>{clearTimeout(timer);resolve({stdout,stderr,exitCode,reason})});
 });
}
export async function executeCandidate(code,cases,{deadline=8000}={}){
 if(typeof code!=='string'||code.length>24000||cases.length>30)throw Error('Candidate or case limit exceeded');
 const scratch=fileURLToPath(new URL('../.runner-work/',import.meta.url));await mkdir(scratch,{recursive:true});
 const temp=await mkdtemp(path.join(scratch,'assessment-')),name='fixfirst-assessment-'+randomUUID(),nonce=randomUUID();
 try {
  await writeFile(path.join(temp,'candidate.mjs'),code);await copyFile(path.join(directory,'runtime.mjs'),path.join(temp,'runtime.mjs'));
  const created=await docker(['create','--pull=never','--name',name,'--interactive','--network=none','--read-only','--user=65534:65534',
   '--cap-drop=ALL','--security-opt=no-new-privileges','--memory=256m','--memory-swap=256m','--cpus=1','--pids-limit=64','--log-driver=none',
   '--ulimit=nofile=128:128','--tmpfs=/tmp:rw,noexec,nosuid,size=16m','--mount',`type=bind,source=${temp},target=/task,readonly`,
   '--workdir=/task','--entrypoint=node',IMAGE,'runtime.mjs'],{deadline:10000});
  if(created.exitCode!==0)throw Error('Isolated grader unavailable: '+created.stderr.slice(0,300));
  // Only input arguments and a per-run nonce cross into the candidate container.
  const result=await docker(['start','--attach','--interactive',name],{input:JSON.stringify({nonce,cases:cases.map(c=>({args:c.args}))}),deadline});
  if(result.reason||result.exitCode!==0)return {error:result.reason||'execution-error',outputs:[]};
  let packet;try{packet=JSON.parse(result.stdout)}catch{return {error:'invalid-protocol',outputs:[]}};
  if(packet.nonce!==nonce||packet.error||!Array.isArray(packet.outputs)||packet.outputs.length!==cases.length)return {error:packet.error||'invalid-protocol',outputs:[]};
  return {outputs:packet.outputs,sourceHash:sha(code)};
 }finally{await docker(['rm','--force',name],{deadline:5000}).catch(()=>{});await rm(temp,{recursive:true,force:true});}
}
const matches=(output,expected)=>output?.status==='returned'&&output.mutated===false&&isDeepStrictEqual(output.value,expected);
export async function gradeTask(submission,{freeze=true}={}){
 const frozen=freeze?await verifyFreeze():await fingerprint();
 const task=bank.find(t=>t.id===submission.taskId);if(!task)throw Error('Unknown assessment task');
 if(freeze&&(submission.bankHash!==frozen.bankHash||submission.version!==frozen.version))throw Error('Submission belongs to a different benchmark version');
 if(typeof submission.code!=='string'||submission.code.length>24000)throw Error('Invalid candidate source');
 const custom=submission.custom||null;
 if(custom&&(!Array.isArray(custom.args)||!Object.hasOwn(custom,'expected')||JSON.stringify(custom).length>4000))throw Error('Invalid custom regression');
 const cases=[...task.cases,...(custom?[{args:custom.args,expected:custom.expected,kind:'custom'}]:[])];
 const settled=await Promise.allSettled([
  executeCandidate(submission.code,cases),
  ...(custom?[executeCandidate(task.baseline,[custom]),executeCandidate(task.reference,[custom])]:[])
 ]);
 for(const item of settled)if(item.status==='rejected')throw item.reason;
 const [candidate,original,reference]=settled.map(r=>r.value);
 const details=task.cases.map((c,i)=>({case:'case-'+i,kind:c.kind,passed:matches(candidate.outputs[i],c.expected)}));
 const target=details.filter(c=>c.kind==='target'),control=details.filter(c=>c.kind==='control');
 const novel=!!custom&&!task.examples.some(c=>isDeepStrictEqual(c.args,custom.args));
 const validRegression=!!custom&&novel&&!original.error&&!reference.error&&matches(reference.outputs[0],custom.expected)&&!matches(original.outputs[0],custom.expected)&&matches(candidate.outputs.at(-1),custom.expected);
 const scores={targetCases:50*target.filter(c=>c.passed).length/target.length,controlCases:20*control.filter(c=>c.passed).length/control.length,novelValidRegression:validRegression?10:0,humanDiagnosis:null};
 return {taskId:task.id,form:task.form,family:task.family,exploratory:task.exploratory,version:frozen.version||'unfrozen',bankHash:frozen.bankHash,sourceHash:sha(submission.code),
  allBehaviourPassed:!candidate.error&&details.every(c=>c.passed),automaticScore:Math.round((scores.targetCases+scores.controlCases+scores.novelValidRegression)*100)/100,automaticMaximum:80,scores,
  cases:details,regression:{provided:!!custom,novel,valid:validRegression},error:candidate.error||null,diagnosisStatus:'Requires blinded human review; no automatic diagnosis score',integrity:'Host compares actual values; no candidate-provided pass claims are trusted. This does not establish identity or unaided work.'};
}
