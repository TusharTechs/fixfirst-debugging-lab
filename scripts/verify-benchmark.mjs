import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {bank} from '../benchmark/tasks.mjs';
import {gradeTask,executeCandidate,verifyFreeze} from '../benchmark/grader.mjs';
const frozen=await verifyFreeze(),report={kind:'benchmark-technical-verification',at:new Date().toISOString(),version:frozen.version,bankHash:frozen.bankHash,notLearnerData:true,tasks:[],adversarial:[]};
for(const task of bank){
 const common={taskId:task.id,bankHash:frozen.bankHash,version:frozen.version};
 const original=await gradeTask({...common,code:task.baseline});
 const reference=await gradeTask({...common,code:task.reference,custom:task.regression});
 assert.equal(original.allBehaviourPassed,false,task.id+' baseline must fail');
 assert.equal(reference.allBehaviourPassed,true,task.id+' repair must pass');assert.equal(reference.automaticScore,80,task.id+' meaningful regression must qualify');assert.equal(reference.scores.humanDiagnosis,null);
 report.tasks.push({taskId:task.id,baseline:original,reference});console.log(task.id+': baseline fails; reference 80/80 automatic; human review unscored');
}
for(const [name,code,deadline]of [
 ['fake pass claim','console.log(JSON.stringify({passed:true,score:100}));process.exit(0);',8000],
 ['syntax error','export function solve( {',8000],
 ['infinite loop','while(true){};export function solve(){}',1000],
 ['noisy output','console.log("x".repeat(40000));export function solve(){return true}',8000]
]){const result=await executeCandidate(code,[{args:[],expected:true}],{deadline});assert.ok(result.error,name);report.adversarial.push({name,error:result.error});}
const first=bank[0],vacuous=await gradeTask({taskId:first.id,code:first.reference,custom:{args:first.examples[0].args,expected:first.examples[0].expected},bankHash:frozen.bankHash,version:frozen.version});assert.equal(vacuous.regression.valid,false);report.adversarial.push({name:'Copied visible example earns no regression credit',passed:true});
const args=process.argv.slice(2),i=args.indexOf('--out');if(i>=0)await writeFile(args[i+1],JSON.stringify(report,null,2)+'\n');
console.log('All 8 tasks and 5 adversarial checks passed. This verifies the harness, not learning outcomes.');
