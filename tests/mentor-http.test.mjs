import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
test('local mentor endpoint rejects cross-origin, wrong content type, oversized input and excess requests',async()=>{
 let calls=0;const server=createApp({provider:async()=>{calls++;return{text:'1'}},maxHintsPerMinute:3});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const send=(body,headers={})=>fetch(base+'/api/mentor',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...headers},body:JSON.stringify(body)});
 try {
  assert.equal((await send({}, {Origin:'https://example.com'})).status,403);
  assert.equal((await send({}, {'Content-Type':'text/plain'})).status,415);
  assert.equal((await send({payload:'x'.repeat(70000)})).status,413);
  const transfer=await send({taskId:'inventory',transfer:false});assert.equal((await transfer.json()).stage,'transfer');
  assert.equal((await send({taskId:'unknown'})).status,400);
  assert.equal((await send({taskId:'inventory'})).status,429);assert.equal(calls,0);
 }finally {await new Promise(r=>server.close(r))}
});
