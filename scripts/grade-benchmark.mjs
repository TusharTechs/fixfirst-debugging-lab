import {readFile,writeFile} from 'node:fs/promises';
import {bank} from '../benchmark/tasks.mjs';
import {gradeTask,verifyFreeze} from '../benchmark/grader.mjs';
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
try {
 if(!get('--submission'))throw Error('Use --submission /path/to/assessment-export.json');
 const packet=JSON.parse(await readFile(get('--submission'),'utf8'));
 if(packet.kind!=='fixfirst-assessment')throw Error('Expected a FixFirst assessment export');
 const frozen=await verifyFreeze();if(packet.bankHash!==frozen.bankHash||packet.version!==frozen.version)throw Error('Benchmark version mismatch');
 if(!['A','B'].includes(packet.session?.form)||!Array.isArray(packet.tasks))throw Error('Invalid form or task collection');
 const expected=bank.filter(t=>t.form===packet.session.form),provided=new Map();
 for(const task of packet.tasks){if(provided.has(task.taskId)||!expected.some(t=>t.id===task.taskId))throw Error('Duplicate or foreign-form task');provided.set(task.taskId,task);}
 const results=[];
 for(const task of expected){
  const submitted=provided.get(task.id);
  if(!submitted||submitted.attempted===false)results.push({taskId:task.id,form:task.form,family:task.family,exploratory:task.exploratory,allBehaviourPassed:false,automaticScore:0,automaticMaximum:80,missing:true,humanReviewPending:true});
  else results.push(await gradeTask({...submitted,bankHash:packet.bankHash,version:packet.version}));
 }
 const scored=results.filter(t=>!t.exploratory);
 const report={kind:'fixfirst-assessment-grade',at:new Date().toISOString(),notLearnerData:packet.notLearnerData===true||packet.session?.phase==='preview',session:packet.session,version:packet.version,bankHash:packet.bankHash,results,
  trainedFamilyBehaviourPassRate:scored.filter(t=>t.allBehaviourPassed).length/scored.length,source:'Operator-run isolated candidate grading, not a learner outcome study',humanReviewPending:true};
 if(get('--out'))await writeFile(get('--out'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error.message);process.exitCode=1}
