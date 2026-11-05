import {readFile,writeFile} from 'node:fs/promises';
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
for(const name of ['--allocation','--enrolled','--grades'])if(!get(name))throw Error('Required: --allocation, --enrolled, --grades. Use explicit empty arrays when no learner records exist.');
const read=async key=>JSON.parse(await readFile(get(key),'utf8'));
const allocation=await read('--allocation'),enrolled=await read('--enrolled'),grades=await read('--grades');
if(!Array.isArray(enrolled)||!Array.isArray(grades)||allocation.kind!=='planned-study-allocation')throw Error('Invalid study files');
const slots=new Map(allocation.slots.map(s=>[s.code,s])),records=new Map();
for(const grade of grades){
 if(grade.notLearnerData===true)throw Error('Synthetic or preview grades cannot enter learner analysis');
 if(grade.kind!=='fixfirst-assessment-grade'||grade.bankHash!==allocation.bankHash)throw Error('Mixed benchmark versions or invalid grade report');
 const code=grade.session?.allocationCode,slot=slots.get(code),phase=grade.session?.phase;
 if(!slot||!['pretest','posttest'].includes(phase)||grade.session.form!==slot[phase+'Form'])throw Error('Grade does not match its planned code, phase and form');
 if(!Number.isFinite(grade.trainedFamilyBehaviourPassRate)||grade.trainedFamilyBehaviourPassRate<0||grade.trainedFamilyBehaviourPassRate>1)throw Error('Invalid behavioural pass rate');
 const key=code+':'+phase;if(records.has(key))throw Error('Duplicate phase: do not select the best of multiple attempts');records.set(key,grade);
}
const codes=new Set();for(const code of enrolled){if(!slots.has(code)||codes.has(code))throw Error('Invalid or duplicate enrolled study code');codes.add(code)}
for(const key of records.keys())if(!codes.has(key.split(':')[0]))throw Error('Grade exists for a code not in the explicit enrollment list');
const rows=[...codes].map(code=>{const slot=slots.get(code),pre=records.get(code+':pretest'),post=records.get(code+':posttest');return {code,arm:slot.arm,pretest:pre?.trainedFamilyBehaviourPassRate??null,posttest:post?.trainedFamilyBehaviourPassRate??0,posttestMissing:!post}});
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const arms=Object.fromEntries(['local-model','guided-baseline'].map(arm=>{const selected=rows.filter(r=>r.arm===arm);return [arm,{enrolled:selected.length,posttestsReceived:selected.filter(r=>!r.posttestMissing).length,posttestsMissing:selected.filter(r=>r.posttestMissing).length,meanPretestAvailable:mean(selected.filter(r=>r.pretest!==null).map(r=>r.pretest)),meanPosttestITT:mean(selected.map(r=>r.posttest))}]}));
const result={kind:'descriptive-study-report',version:allocation.version,bankHash:allocation.bankHash,enrolled:rows.length,arms,rows,status:rows.length?'Descriptive only; formal preregistered analysis and human review remain necessary':'No learner results: no effect estimate can be computed',effectEstimate:null,disclosure:'Planned slots are not participants. Missing posttests are zero in descriptive ITT means. This script does not estimate adjusted causal effects, uncertainty intervals or statistical significance.'};
if(get('--out'))await writeFile(get('--out'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
