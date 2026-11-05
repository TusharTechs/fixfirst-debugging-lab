import {test} from 'node:test';import assert from 'node:assert/strict';import {createApp} from '../server.mjs';
import {tasks} from '../public/tasks.js';
test('active assessment blocks relabelled practice coaching and never serves answer bank',async()=>{
 let calls=0;const server=createApp({provider:async()=>{calls++;return{text:'OBSERVE'}}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(url,body,cookie='')=>fetch(base+url,{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 try{
  const started=await post('/api/assessment/begin',{form:'A'});assert.equal(started.status,200);const cookie=started.headers.get('set-cookie').split(';')[0],packet=await started.json();assert.equal(packet.tasks.length,4);assert.ok(packet.tasks.every(t=>!('reference'in t)&&!('cases'in t)));
  const blocked=await post('/api/mentor',{taskId:'invoice'},cookie);assert.equal((await blocked.json()).stage,'transfer');assert.equal(calls,0);
  for(const path of ['/benchmark/tasks.mjs','/benchmark/frozen.json','/benchmark/grader.mjs'])assert.equal((await fetch(base+path)).status,404);
  const ended=await post('/api/assessment/end',{},cookie);assert.ok((await ended.json()).session.endedAt);
  const unblocked=await post('/api/mentor',{taskId:'invoice',code:'x',custom:'',hypothesis:'x',run:null});assert.equal((await unblocked.json()).stage,'run-required');
 }finally{await new Promise(r=>server.close(r))}
});
test('server-owned no-model mode ignores client requests to enable the model',async()=>{
 let calls=0;const server=createApp({coachMode:'guided-baseline',provider:async()=>{calls++;return{text:'TRACE'}}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,task=tasks[0];
 try{
  assert.equal((await(await fetch(base+'/api/mentor/config')).json()).mode,'guided-baseline');
  const body={coachMode:'local-model',taskId:task.id,code:task.code,custom:'',hypothesis:'Compare zero with positive balances to investigate the filter.',hints:0,run:{code:task.code,custom:'',results:task.tests.map((t,i)=>({name:t.name,passed:i===0,actual:i===0?JSON.stringify(t.expected):'[]'}))}};
  const result=await(await fetch(base+'/api/mentor',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)})).json();assert.equal(result.mode,'guided-baseline');assert.equal(calls,0);
 }finally{await new Promise(r=>server.close(r))}
});
