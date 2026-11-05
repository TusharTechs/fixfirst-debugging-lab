import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {verifyFreeze} from '../benchmark/grader.mjs';
const exec=promisify(execFile),root=new URL('../',import.meta.url).pathname;
test('planned allocation is balanced, empty learner report has no effect estimate, and synthetic grades are rejected',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'fixfirst-report-test-'));const allocation=path.join(temp,'allocation.json'),enrolled=path.join(temp,'enrolled.json'),grades=path.join(temp,'grades.json'),out=path.join(temp,'report.json');
 try{
  await exec(process.execPath,['scripts/allocate-study.mjs','--slots','8','--seed','test-only','--out',allocation],{cwd:root});
  const plan=JSON.parse(await readFile(allocation,'utf8'));assert.ok(plan.plannedOnly);for(let block=0;block<2;block++){const rows=plan.slots.filter(s=>s.block===block);assert.equal(new Set(rows.map(s=>s.arm+':'+s.pretestForm)).size,4)}
  await writeFile(enrolled,'[]');await writeFile(grades,'[]');
  const args=['scripts/report-study.mjs','--allocation',allocation,'--enrolled',enrolled,'--grades',grades,'--out',out];await exec(process.execPath,args,{cwd:root});const empty=JSON.parse(await readFile(out,'utf8'));assert.equal(empty.enrolled,0);assert.equal(empty.effectEstimate,null);assert.equal(empty.arms['local-model'].meanPosttestITT,null);
  const slot=plan.slots[0];await writeFile(enrolled,JSON.stringify([slot.code]));await writeFile(grades,JSON.stringify([{kind:'fixfirst-assessment-grade',bankHash:plan.bankHash,notLearnerData:true,session:{allocationCode:slot.code,phase:'pretest',form:slot.pretestForm},trainedFamilyBehaviourPassRate:1}]));await assert.rejects(exec(process.execPath,args,{cwd:root}),error=>error.stderr.includes('Synthetic or preview grades'));
 }finally{await rm(temp,{recursive:true,force:true})}
});
test('unattempted omitted tasks score zero and wrong-version exports cannot be graded',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'fixfirst-missing-test-')),submission=path.join(temp,'submission.json'),out=path.join(temp,'grade.json');
 try{
  const frozen=await verifyFreeze(),packet={kind:'fixfirst-assessment',version:frozen.version,bankHash:frozen.bankHash,session:{form:'A',phase:'preview'},tasks:[]};await writeFile(submission,JSON.stringify(packet));await exec(process.execPath,['scripts/grade-benchmark.mjs','--submission',submission,'--out',out],{cwd:root});const grade=JSON.parse(await readFile(out,'utf8'));assert.equal(grade.results.length,4);assert.ok(grade.results.every(r=>r.missing&&r.automaticScore===0));assert.equal(grade.trainedFamilyBehaviourPassRate,0);assert.ok(grade.notLearnerData);
  packet.bankHash='wrong';await writeFile(submission,JSON.stringify(packet));await assert.rejects(exec(process.execPath,['scripts/grade-benchmark.mjs','--submission',submission],{cwd:root}),error=>error.stderr.includes('version mismatch'));
 }finally{await rm(temp,{recursive:true,force:true})}
});
