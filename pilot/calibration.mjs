import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bank} from '../benchmark/tasks.mjs';
import {verifyFreeze} from '../benchmark/grader.mjs';
const protocolText=await readFile(new URL('./protocol.json',import.meta.url),'utf8');
export const protocol=JSON.parse(protocolText);
const implementation=await readFile(new URL('./calibration.mjs',import.meta.url),'utf8');
export const policyHash=createHash('sha256').update(protocolText).update(implementation).digest('hex');
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2};
export async function calibrationReport(records,grades){
 const frozen=await verifyFreeze();
 if(!Array.isArray(records)||!Array.isArray(grades))throw Error('Use arrays of observations and grade reports');
 const seen=new Set(),excludedCodes=new Set(),accepted=[],exclusions=[],counts={demo:0,noConsent:0,exposedOrUnknown:0,excludedGrades:0};
 for(const record of records){
  if(record?.kind!=='fixfirst-calibration-observation')throw Error('Invalid calibration record');
  if(record.source==='technical-demo'){counts.demo++;if(typeof record.participantCode==='string')excludedCodes.add(record.participantCode);continue;}
  if(record.source!=='human-calibration')throw Error('Unknown observation source');
  if(record.bankHash!==frozen.bankHash||record.policyHash!==policyHash||record.version!==frozen.version)throw Error('Mixed bank or calibration policy versions');
  if(!/^[A-Za-z0-9-]{1,40}$/.test(record.participantCode)||!['A','B'].includes(record.form))throw Error('Invalid random code or form');
  if(seen.has(record.participantCode))throw Error('Duplicate participant code: do not choose the best repeated observation');seen.add(record.participantCode);
  if(record.consent?.acknowledged!==true||record.consent?.informationVersion!==protocol.participantInformationVersion){counts.noConsent++;excludedCodes.add(record.participantCode);exclusions.push({code:record.participantCode,reason:'no-explicit-current-consent'});continue;}
  if(record.exposure!=='none'){counts.exposedOrUnknown++;excludedCodes.add(record.participantCode);exclusions.push({code:record.participantCode,reason:'exposed-or-unknown-exposure'});continue;}
  if(!Array.isArray(record.tasks))throw Error('Missing task observations');
  const taskIds=new Set();for(const row of record.tasks){
   if(!bank.some(t=>t.id===row.taskId&&t.form===record.form)||taskIds.has(row.taskId))throw Error('Foreign-form or duplicate task observation');taskIds.add(row.taskId);
   for(const key of ['clarity','difficulty'])if(row[key]!==null&&row[key]!==undefined&&(!Number.isInteger(row[key])||row[key]<1||row[key]>5))throw Error('Ratings must be 1–5 or null');
   if(row.minutes!==null&&row.minutes!==undefined&&(!Number.isFinite(row.minutes)||row.minutes<0||row.minutes>120))throw Error('Invalid self-reported duration');
   if(!['attempted','skipped','not-reported'].includes(row.status)||!['none','human','ai','other','not-reported'].includes(row.assistance))throw Error('Invalid observation status');
  }
  accepted.push(record);
 }
 const lookup=new Map();for(const grade of grades){
  if(excludedCodes.has(grade.session?.allocationCode)){counts.excludedGrades++;continue;}
  if(grade.kind!=='fixfirst-assessment-grade'||grade.bankHash!==frozen.bankHash||grade.version!==frozen.version)throw Error('Invalid or mixed-version calibration grade');
  const code=grade.session?.allocationCode,form=grade.session?.form;
  if(grade.session?.phase!=='preview')throw Error('Calibration requires preview grades, not intervention outcomes');
  if(!accepted.some(r=>r.participantCode===code&&r.form===form))throw Error('Grade has no eligible matching calibration observation');
  const observation=accepted.find(r=>r.participantCode===code);if(observation?.assessmentSessionId&&observation.assessmentSessionId!==grade.session.id)throw Error('Assessment session does not match the linked export');
  if(lookup.has(code))throw Error('Duplicate calibration grade');
  if(!Array.isArray(grade.results))throw Error('Missing grade results');const ids=new Set();
  for(const result of grade.results){if(ids.has(result.taskId)||!bank.some(t=>t.id===result.taskId&&t.form===form))throw Error('Invalid grade task');ids.add(result.taskId);if(typeof result.allBehaviourPassed!=='boolean')throw Error('Invalid behavioural grade');}
  lookup.set(code,grade);
 }
 const tasks=bank.map(task=>{
  const rows=accepted.filter(r=>r.form===task.form).map(r=>({code:r.participantCode,row:r.tasks.find(t=>t.taskId===task.id)}));
  const independent=rows.filter(({row})=>row?.status==='attempted'&&row.assistance==='none');
  const graded=independent.map(({code})=>lookup.get(code)?.results.find(t=>t.taskId===task.id)).filter(r=>r&&!r.missing);
  const passRate=graded.length?graded.filter(r=>r.allBehaviourPassed).length/graded.length:null;
  const clarityValues=independent.map(({row})=>row.clarity).filter(Number.isFinite);
  const clarity=median(clarityValues);
  const difficulty=median(independent.map(({row})=>row.difficulty).filter(Number.isFinite));
  const minutes=median(independent.map(({row})=>row.minutes).filter(Number.isFinite));
  const flags=[];if(independent.length<protocol.minimumIndependentAttemptsPerTask)flags.push('insufficient-independent-attempts');if(graded.length<protocol.minimumIndependentAttemptsPerTask)flags.push('insufficient-graded-attempts');
  if(clarityValues.length<protocol.minimumIndependentAttemptsPerTask)flags.push('insufficient-clarity-ratings');
  if(clarity!==null&&clarity<protocol.clarityReviewBelow)flags.push('clarity-review');
  if(graded.length>=protocol.minimumIndependentAttemptsPerTask){if(passRate<protocol.floorFlagBelow)flags.push('possible-floor');if(passRate>protocol.ceilingFlagAbove)flags.push('possible-ceiling');}
  return {taskId:task.id,form:task.form,family:task.family,exploratory:task.exploratory,independentAttempts:independent.length,gradedAttempts:graded.length,ungradedAttempts:independent.length-graded.length,assistedOrUnreported:rows.filter(({row})=>row?.status==='attempted'&&row.assistance!=='none').length,skippedOrUnreported:rows.filter(({row})=>!row||row.status!=='attempted').length,passRate,onePersonRateIncrement:graded.length?1/graded.length:null,clarityResponses:clarityValues.length,issueCounts:Object.fromEntries(['ambiguous-contract','tooling','difficulty','example-mismatch','accessibility','other'].map(issue=>[issue,rows.filter(({row})=>row?.issues?.includes(issue)).length])),medianClarity:clarity,medianDifficulty:difficulty,medianSelfReportedMinutes:minutes,flags};
 });
 const familyComparisons=['parsing','async-state','graph-state'].map(family=>{
  const pair=tasks.filter(t=>t.family===family);const covered=pair.every(t=>t.gradedAttempts>=protocol.minimumIndependentAttemptsPerTask);
  const gap=covered?Math.abs(pair[0].passRate-pair[1].passRate):null;
  return {family,formGap:gap,status:!covered?'insufficient-coverage':gap>protocol.formGapFlagAbove?'review-form-difference':'coverage-met-human-review-required',notEquivalenceProof:true};
 });
 return {kind:'calibration-triage-report',at:new Date().toISOString(),version:frozen.version,bankHash:frozen.bankHash,policyVersion:protocol.version,policyHash,counts:{humanRecords:seen.size,eligibleUnexposedConsentingRecords:accepted.length,...counts},exclusions,tasks,familyComparisons,status:accepted.length?'Calibration triage only; human review and fresh-version decisions remain necessary':'No eligible human calibration data',equivalenceEstablished:false,learnerEffectEstimate:null,thresholds:protocol,disclosure:'Demo records are excluded. Sparse or missing grades stay unknown. Coverage gates are triage defaults, not power analysis or proof of matched forms. Source and free-text notes are not included.'};
}
