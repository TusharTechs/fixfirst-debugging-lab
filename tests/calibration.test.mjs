// Positive fixtures here are fabricated unit-test inputs, never exported as human observations.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {bank} from '../benchmark/tasks.mjs';import {verifyFreeze} from '../benchmark/grader.mjs';
import {calibrationReport,protocol,policyHash} from '../pilot/calibration.mjs';
const frozen=await verifyFreeze();
const observation=(code='TEST-001',changes={})=>({kind:'fixfirst-calibration-observation',source:'human-calibration',version:frozen.version,bankHash:frozen.bankHash,policyHash,participantCode:code,form:'A',consent:{acknowledged:true,informationVersion:protocol.participantInformationVersion},exposure:'none',tasks:bank.filter(t=>t.form==='A').map(t=>({taskId:t.id,status:'attempted',assistance:'none',clarity:5,difficulty:3,minutes:7,issues:[],notes:'unit-only private marker'})),...changes});
const grade=record=>({kind:'fixfirst-assessment-grade',version:frozen.version,bankHash:frozen.bankHash,notLearnerData:true,session:{allocationCode:record.participantCode,form:record.form,phase:'preview',id:'test-session'},results:bank.filter(t=>t.form===record.form).map(t=>({taskId:t.id,allBehaviourPassed:true}))});
test('empty and demo-only records never produce human counts or form equivalence',async()=>{
 const report=await calibrationReport([{kind:'fixfirst-calibration-observation',source:'technical-demo'}],[]);assert.equal(report.counts.demo,1);assert.equal(report.counts.humanRecords,0);assert.equal(report.learnerEffectEstimate,null);assert.equal(report.equivalenceEstablished,false);assert.ok(report.tasks.every(t=>t.passRate===null&&t.flags.includes('insufficient-independent-attempts')));
});
test('explicit consent and no prior exposure are required, with exclusion reasons retained',async()=>{
 const report=await calibrationReport([observation('TEST-1',{consent:{acknowledged:false}}),observation('TEST-2',{exposure:'exposed'}),observation('TEST-3',{exposure:'unknown'})],[]);assert.equal(report.counts.humanRecords,3);assert.equal(report.counts.eligibleUnexposedConsentingRecords,0);assert.equal(report.exclusions.length,3);
});
test('missing grades remain unknown; assistance and unreported work are not independent attempts',async()=>{
 const record=observation();record.tasks[1].assistance='ai';record.tasks[2].status='not-reported';const report=await calibrationReport([record],[]),task=report.tasks.find(t=>t.taskId===record.tasks[0].taskId);assert.equal(task.independentAttempts,1);assert.equal(task.gradedAttempts,0);assert.equal(task.passRate,null);assert.ok(task.flags.includes('insufficient-graded-attempts'));assert.ok(report.tasks.find(t=>t.taskId===record.tasks[1].taskId).assistedOrUnreported===1);assert.ok(!JSON.stringify(report).includes('unit-only private marker'));
});
test('coverage gates can flag ceiling but never claim equivalence or power',async()=>{
 const records=Array.from({length:5},(_,i)=>observation('TEST-'+i));const report=await calibrationReport(records,records.map(grade));assert.equal(report.tasks[0].passRate,1);assert.ok(report.tasks[0].flags.includes('possible-ceiling'));assert.equal(report.tasks[0].onePersonRateIncrement,0.2);assert.equal(report.familyComparisons[0].status,'insufficient-coverage');assert.equal(report.equivalenceEstablished,false);
});
test('mixed versions, duplicate people/grades and wrong session links are rejected',async()=>{
 await assert.rejects(calibrationReport([observation('TEST-X',{bankHash:'wrong'})],[]));await assert.rejects(calibrationReport([observation(),observation()],[]));const record=observation();await assert.rejects(calibrationReport([record],[grade(record),grade(record)]));await assert.rejects(calibrationReport([{...record,assessmentSessionId:'different'}],[grade(record)]));const wrong=grade(record);wrong.session.phase='posttest';await assert.rejects(calibrationReport([record],[wrong]));
});
test('invalid ratings, cross-form tasks and missing assistance cannot silently enter scores',async()=>{
 const invalid=observation();invalid.tasks[0].clarity=0;await assert.rejects(calibrationReport([invalid],[]));const foreign=observation();foreign.tasks[0].taskId=bank.find(t=>t.form==='B').id;await assert.rejects(calibrationReport([foreign],[]));const uncertain=observation();uncertain.tasks[0].assistance='not-reported';const report=await calibrationReport([uncertain],[]);assert.equal(report.tasks[0].independentAttempts,0);
});
test('grades paired with demo or excluded observations are excluded rather than contaminating human summaries',async()=>{
 const demo=observation('DEMO-1',{source:'technical-demo'}),exposed=observation('EXPOSED-1',{exposure:'exposed'});const report=await calibrationReport([demo,exposed],[grade(demo),grade(exposed)]);assert.equal(report.counts.demo,1);assert.equal(report.counts.excludedGrades,2);assert.equal(report.counts.eligibleUnexposedConsentingRecords,0);assert.ok(report.tasks.every(t=>t.gradedAttempts===0));
});
