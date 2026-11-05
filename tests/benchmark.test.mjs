import {test} from 'node:test';import assert from 'node:assert/strict';
import {bank,publicTask} from '../benchmark/tasks.mjs';import {verifyFreeze} from '../benchmark/grader.mjs';
import {coach,coachBaseline,prepareContext} from '../mentor/policy.mjs';import {tasks} from '../public/tasks.js';
test('bank is frozen, paired by trained family and absent from public practice',async()=>{
 const frozen=await verifyFreeze();assert.equal(frozen.version,'transfer-dev-v1.2');assert.equal(new Set(bank.map(t=>t.id)).size,8);
 for(const form of ['A','B']){const group=bank.filter(t=>t.form===form);assert.equal(group.length,4);assert.deepEqual(group.filter(t=>!t.exploratory).map(t=>t.family).sort(),['async-state','graph-state','parsing']);}
 assert.ok(bank.every(t=>!tasks.some(p=>p.id===t.id)));
});
test('public assessment projection excludes cases, references and grading regressions',()=>{
 for(const task of bank){const visible=publicTask(task);assert.ok(!Object.hasOwn(visible,'reference'));assert.ok(!Object.hasOwn(visible,'cases'));assert.ok(!Object.hasOwn(visible,'regression'));assert.equal(visible.code,task.baseline);assert.ok(visible.transfer);assert.ok(!JSON.stringify(visible).includes(task.reference));}
});
test('all assessment identifiers are blocked before model invocation',async()=>{
 let calls=0;for(const task of bank){const result=await coach({taskId:task.id},async()=>{calls++;return{text:'TRACE'}});assert.equal(result.stage,'transfer');assert.equal(coachBaseline({taskId:task.id}).stage,'transfer');}assert.equal(calls,0);
});
test('no-model comparator uses identical prerequisites, prompts and evidence without provider access',async()=>{
 const task=tasks[0],input={taskId:task.id,code:task.code,custom:'',hypothesis:'The zero case differs from the positive-balance control; compare the filtering condition.',hints:1,run:{code:task.code,custom:'',results:task.tests.map((t,i)=>({name:t.name,passed:i===0,actual:i===0?JSON.stringify(t.expected):'[]'}))}};
 const baseline=coachBaseline(input),context=prepareContext(input).context;
 const model=await coach(input,async()=>({text:context.choices[0].toUpperCase(),metadata:{model:'test-double'}}));
 assert.equal(baseline.mode,'guided-baseline');assert.equal(baseline.provider,null);assert.equal(baseline.action,model.action);assert.equal(baseline.message,model.message);assert.deepEqual(baseline.evidence,model.evidence);
 assert.equal(coachBaseline({...input,run:null}).stage,'run-required');
});
