import {test} from 'node:test';import assert from 'node:assert/strict';import {createPilotServer} from '../scripts/pilot-server.mjs';
test('pilot accepts no observation POSTs and exposes no private configuration file or answers',async()=>{
 const server=createPilotServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const config=await(await fetch(base+'/config')).json();assert.ok(config.policyHash);assert.ok(!('tasks'in config));const tasks=await(await fetch(base+'/tasks?form=A')).json();assert.equal(tasks.length,4);assert.ok(tasks.every(t=>!('reference'in t)&&!('code'in t)&&!('cases'in t)));assert.equal((await fetch(base+'/observations',{method:'POST',body:'{}'})).status,405);for(const path of ['/local-config.json','/pilot/local-config.json','/benchmark/tasks.mjs'])assert.equal((await fetch(base+path)).status,404);}finally{await new Promise(r=>server.close(r))}
});
