import {spawn} from 'node:child_process';
import {readFile,writeFile,copyFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const taskIds=['url-join-fragment','debounce-rejection','stringify-shared-reference'];
const sha=data=>createHash('sha256').update(data).digest('hex');
function command(args,deadline,outputLimit=131072){
 return new Promise((resolve,reject)=>{
  const child=spawn('docker',args,{stdio:['ignore','pipe','pipe']});
  let output='',bytes=0,reason=null;
  const timer=setTimeout(()=>{reason='deadline';child.kill('SIGKILL')},deadline);
  const collect=data=>{bytes+=data.length;if(bytes>outputLimit){reason='output-limit';child.kill('SIGKILL');return;}output+=data.toString()};
  child.stdout.on('data',collect);child.stderr.on('data',collect);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.on('close',(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal,reason,output})});
 });
}
export async function replay({candidatePath=null,taskId='url-join-fragment'}={}) {
 if(!taskIds.includes(taskId))throw Error('Unknown curated task: '+taskId);
 const root=fileURLToPath(new URL('../corpus/'+taskId+'/',import.meta.url));
 const manifest=JSON.parse(await readFile(root+'manifest.json','utf8'));
 for(const [name,expected] of Object.entries(manifest.sha256)){
  if(sha(await readFile(path.join(root,name)))!==expected)throw Error('Corpus integrity mismatch: '+name);
 }
 const plan=manifest.replay||{
  sourcePath:manifest.sourcePath,
  files:[{from:'baseline/package.json',to:'package.json'},{from:'baseline/LICENSE',to:'LICENSE'},{from:'baseline/README.md',to:'README.md'},{from:'reference/test/tests.js',to:'test/tests.js'}],
  command:['--test','--test-reporter=tap','test/tests.js'],expectedBaselineFailures:2,suite:'Full upstream suite at the fix commit'
 };
 const stages=candidatePath?['baseline','candidate']:['baseline','reference'];
 const output={task:manifest.id,at:new Date().toISOString(),baselineCommit:manifest.baselineCommit,fixCommit:manifest.fixCommit,image:manifest.runtime.image,policy:manifest.runtime,runs:[]};
 for(const stage of stages){
  const scratch=fileURLToPath(new URL('../.runner-work/',import.meta.url));
  await mkdir(scratch,{recursive:true});
  const temp=await mkdtemp(path.join(scratch,'replay-'));
  const name='fixfirst-replay-'+randomUUID();
  try {
   // Only these curated files are mounted: no repo root, answer directory, keys or Docker socket.
   const source=await readFile(candidatePath&&stage==='candidate'?candidatePath:path.join(root,stage==='reference'?'reference':'baseline',plan.sourcePath));
   const stagedSource=path.join(temp,plan.sourcePath);await mkdir(path.dirname(stagedSource),{recursive:true});await writeFile(stagedSource,source);
   for(const file of plan.files){const target=path.join(temp,file.to);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(root,file.from),target);}
   const args=['create','--pull=never','--name',name,'--network=none','--read-only','--user=65534:65534',
    '--cap-drop=ALL','--security-opt=no-new-privileges','--memory=256m','--memory-swap=256m','--cpus=1','--pids-limit=64',
    '--ulimit=nofile=128:128','--log-driver=none','--tmpfs=/tmp:rw,noexec,nosuid,size=16m',
    '--mount',`type=bind,source=${temp},target=/task,readonly`,'--workdir=/task','--entrypoint=node',manifest.runtime.image,
    ...plan.command];
   const created=await command(args,10000);
   if(created.exitCode!==0)throw Error('Unable to create isolated runner. Ensure Docker is running and the pinned image is available. '+created.output);
   const result=await command(['start','--attach',name],manifest.runtime.deadlineSeconds*1000,manifest.runtime.outputLimitBytes);
   const numbers={};for(const [,key,value] of result.output.matchAll(/^# (tests|pass|fail|cancelled|skipped) (\d+)$/gm))numbers[key]=Number(value);
   output.runs.push({stage,suite:plan.suite,sourceSha256:sha(source),...result,counts:numbers});
  } finally {
   // Killing the client alone would leave a container alive; always remove this owned container.
   await command(['rm','--force',name],5000).catch(()=>{});
   await rm(temp,{recursive:true,force:true});
  }
 }
 const [baseline,repair]=output.runs;
 output.reproduced=baseline.exitCode===1&&!baseline.reason&&baseline.counts.fail===plan.expectedBaselineFailures;
 output.repaired=repair.exitCode===0&&!repair.reason&&repair.counts.tests>0&&repair.counts.fail===0;
 return output;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try {
  const args=process.argv.slice(2);const get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
  if(args.includes('--all')&&get('--candidate'))throw Error('Choose one task when using --candidate');
  const results=[];
  for(const taskId of args.includes('--all')?taskIds:[get('--task')||taskIds[0]]){
   const result=await replay({candidatePath:get('--candidate'),taskId});results.push(result);
   for(const run of result.runs)console.log(taskId+' '+run.stage+': '+JSON.stringify(run.counts)+(run.reason?' ('+run.reason+')':''));
   console.log('Reproduced: '+result.reproduced+'; repaired: '+result.repaired);
   if(!result.reproduced||!result.repaired)process.exitCode=1;
  }
  if(get('--out'))await writeFile(get('--out'),JSON.stringify(args.includes('--all')?results:results[0],null,2)+'\n');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
