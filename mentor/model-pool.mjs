import {fork} from 'node:child_process';
import {randomUUID} from 'node:crypto';
let child=null,inflight=null;
const failure=code=>Object.assign(new Error(code),{code});
export function plan(messages) {
 if(inflight)return Promise.reject(failure('busy'));
 return new Promise((resolve,reject)=>{
  const id=randomUUID();
  const timer=setTimeout(()=>{const owned=child;child=null;owned?.kill('SIGKILL');settle(failure('timeout'));},30000);
  const settle=(error,result)=>{if(inflight?.id!==id)return;clearTimeout(timer);inflight=null;error?reject(error):resolve(result);};
  inflight={id,settle};
  if(!child){
   // No inherited API credentials; source/hypothesis travel as bounded IPC data, never shell code.
   child=fork(new URL('./model-worker.mjs',import.meta.url),[],{stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH||'',NO_COLOR:'1'},execArgv:[]});
   const owned=child;
   owned.on('message',message=>{if(message?.id!==inflight?.id)return;inflight.settle(message.error?failure('unavailable'):null,{text:message.text,metadata:message.metadata});});
   const stopped=()=>{if(child!==owned)return;child=null;inflight?.settle(failure('unavailable'));};
   owned.on('exit',stopped);owned.on('error',stopped);
  }
  child.send({type:'plan',id,messages},error=>{if(error)settle(failure('unavailable'));});
 });
}
export function closeModel(){const owned=child;child=null;owned?.kill('SIGKILL');inflight?.settle(failure('unavailable'));}
