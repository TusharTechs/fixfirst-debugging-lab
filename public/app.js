import {mentorInput,requestMentor,renderMentor} from './mentor-client.js';
import {runScenario} from './scenarios.js';
import {tasks,provenance} from './tasks.js';
const $=s=>document.querySelector(s);
const coachConfig=await fetch('/api/mentor/config').then(r=>r.json()).catch(()=>({}));
const initialCoachLabel=coachConfig.mode==='guided-baseline'?'Guided coach · no model':'Mentor · mode shown with each response';
const KEY='fixfirst-v1';let mentorController=null;let state={},active=tasks.find(t=>t.id===new URLSearchParams(location.search).get('task'))||tasks[0],busy=false,currentRun=null;
try{state=JSON.parse(localStorage.getItem(KEY)||'{}');if(!state||typeof state!=='object'||Array.isArray(state))state={};}catch{}
const record = () => {
  if (!state[active.id]) state[active.id] = {code: active.code, hypothesis: '', custom: '', runs: [], hints: 0, baseline: false, regressions: {}};
  return state[active.id];
};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('#storage-status').textContent='Storage unavailable · progress is temporary';}}
function changed(){const r=record();const edited=r.code!==$('#code').value||r.custom!==$('#custom').value||r.hypothesis!==$('#hypothesis').value;if(edited&&r.mentorHistory?.length)renderMentor({mode:'guided',stage:'stale',message:'The working context changed after that coaching question. Run this revision and request a new question for current evidence.',evidence:[]});r.code=$('#code').value;r.hypothesis=$('#hypothesis').value;r.custom=$('#custom').value;save();$('#edit-state').textContent=r.code===active.code?'Original source':'Unsaved to portfolio · local draft';updateMilestone();}
function renderNav(){const nav=$('#tasks');nav.replaceChildren();tasks.forEach(task=>{const b=document.createElement('button');b.className='task'+(task.id===active.id?' active':'');b.setAttribute('aria-current',task.id===active.id?'step':'false');const n=document.createElement('span');n.className='num';n.textContent=task.level;const text=document.createElement('span');const title=document.createElement('strong');title.textContent=task.title;const sub=document.createElement('small');sub.textContent=task.area; text.append(title,sub);b.append(n,text);b.onclick=()=>{if(!busy)selectTask(task)};nav.append(b)});}
function selectTask(task){mentorController?.abort();mentorController=null;$('#hint').textContent='Help me investigate →';$('#mentor-evidence').replaceChildren();$('#mentor-mode').textContent=initialCoachLabel;active=task;history.replaceState(null,'','?task='+encodeURIComponent(task.id));$('#code').classList.toggle('repository-source',!!task.provenance);const r=record();renderNav();$('#title').textContent=task.title;$('#task-number').textContent=task.level;$('#meta').textContent=task.area+' · '+task.minutes+' · '+task.skill;$('#brief').textContent=task.brief;$('#contract').textContent=task.contract;showProvenance(task);$('#filename').textContent=task.file;$('#custom').placeholder=JSON.stringify(task.regressionExample||{args:[[{balance:0}]],expected:[{balance:0}]});$('#custom-help').textContent=task.caseHelp||'Use {"args": [...], "expected": ...}. A case must fail on original code and pass on your repair.';$('#code').value=r.code;$('#hypothesis').value=r.hypothesis;$('#custom').value=r.custom;$('#hint').disabled=!!task.transfer;$('#coach-message').textContent=task.transfer?'Transfer mode: investigate this task independently. Coaching is disabled. This public practice task is not a secret or contamination-free assessment.':'Run the tests and write a hypothesis. Then ask for a question that helps you investigate.';$('#edit-state').textContent=r.code===task.code?'Original source':'Local draft';const last=r.runs.at(-1);if(last)showResults(last);else{$('#results').innerHTML='<div class="empty"><span>⌁</span><h3>Start with a failing test.</h3><p>Run the original code to see what breaks.<br>Every fix starts with evidence.</p></div>';$('#test-count').textContent='—';}updateMilestone();save();}
function showProvenance(task) {
  const target=$('#provenance');target.replaceChildren();
  if (!task.provenance) {target.textContent=provenance.kind+' · '+provenance.license+'. '+provenance.limitations;return;}
  const p=task.provenance;
  target.append(document.createTextNode(p.kind+' · '+p.license+' · '+p.copyright+'. Baseline '+p.baselineCommit.slice(0,12)+'. Complete upstream source, unchanged. '+p.contamination+' '));
  for (const [label,url] of [['Source repository',p.repository],['Task manifest','/corpus/'+task.id+'/manifest.json'],['MIT license','/corpus/'+task.id+'/LICENSE'],['Upstream README','/corpus/'+task.id+'/README.md'],['Upstream tests','/corpus/'+task.id+'/upstream-tests.js']]) {
    const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';target.append(a,document.createTextNode(' · '));
  }
}
function updateMilestone() {
  const r=record(), last=r.runs.at(-1);
  const verified=last && !last.error && last.results?.length>0 && last.results.every(t=>t.passed)
    && last.code===r.code && last.custom===r.custom && last.originalCode===active.code;
  // Evidence belongs to this exact run, source revision and custom case.
  // Ignore legacy baselineRegression/regressions flags from earlier prototypes.
  const regressionValid=last?.regression?.original==='failed' && last?.regression?.repaired==='passed';
  const complete=verified && r.baseline && r.hypothesis.trim().length>=20 && regressionValid;
  $('#status').textContent=complete?'Evidence captured':verified?'Tests pass':'Unverified';
  $('#status').className='badge'+(verified?' success':'');
  let message='Your evidence will appear here as you investigate.';
  if (verified) {
    message='Tests pass. Capture an original failing baseline, record your reasoning, and add a regression that fails on original code and passes on your repair.';
    if (last.regression?.original==='passed') message='This custom case also passes on the original code. Choose a case that reproduces the bug.';
    if (last.regression?.original==='error') message='The original-code regression check could not complete. This case does not qualify. '+(last.regression.error || '');
    if (complete) message='✓ Failing baseline → reasoned repair → regression fails on original and passes on repair. Your work sample is ready to export.';
  }
  $('#milestone').textContent=message;
  $('#next').hidden=!(complete && active.next);
}
function showResults(run){const box=$('#results');box.replaceChildren();if(run.error){const p=document.createElement('p');p.className='runner-error';p.textContent=run.error;box.append(p);$('#test-count').textContent='RUN FAILED';return;}const passed=run.results.filter(r=>r.passed).length;$('#test-count').textContent=passed+'/'+run.results.length+' PASS';run.results.forEach(r=>{const d=document.createElement('div');d.className='test-result';const title=document.createElement('strong');title.className=r.passed?'pass':'fail';title.textContent=(r.passed?'✓ ':'× ')+r.name;d.append(title);if(!r.passed){const detail=document.createElement('pre');detail.textContent='Expected: '+r.expected+'\nReceived: '+r.actual+(r.mutated?'\nInput was mutated.':'');d.append(detail)}box.append(d)});}
function finish(payload) {
  if(!currentRun)return;
  const {frame,timer,code,originalCode,custom,taskId}=currentRun;
  clearTimeout(timer);frame.remove();currentRun=null;busy=false;
  $('#run').disabled=false;$('#run').textContent='▶ Run tests';
  const r=state[taskId];
  const run={at:new Date().toISOString(),code,originalCode,custom,...payload};
  r.runs.push(run);if(r.runs.length>50)r.runs.shift();
  if(code===originalCode && payload.results?.some(t=>!t.passed))r.baseline=true;
  save();showResults(run);updateMilestone();
}
$('#run').onclick=()=>{if(busy)return;changed();let custom=null;const raw=record().custom.trim();if(raw){try{custom=JSON.parse(raw);if(!custom||!Array.isArray(custom.args)||!Object.hasOwn(custom,'expected'))throw Error();if(custom.scenario && !(active.allowedScenarios||[]).includes(custom.scenario))throw Error();}catch{showResults({error:'Regression case must be JSON with an args array and an expected value. If using a scenario, choose a recipe supported by this task.'});return;}}busy=true;$('#run').disabled=true;$('#run').textContent='Running…';const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.src='/runner.html';const runId=crypto.randomUUID();currentRun={frame,runId,code:record().code,originalCode:active.code,custom:record().custom,taskId:active.id,request:{type:'execute',runId,code:record().code,originalCode:active.code,entry:active.entry,format:active.format,driverSource:runScenario.toString(),tests:active.tests,custom,taskId:active.id},timer:setTimeout(()=>finish({error:'Execution stopped after 3 seconds. Check for an infinite loop.'}),3000)};document.body.append(frame);};
addEventListener('message',event=>{const run=currentRun;if(!run||event.source!==run.frame.contentWindow)return;if(event.data?.type==='runner-ready')run.frame.contentWindow.postMessage(run.request,'*');if(event.data?.type==='execution-result'&&event.data.runId===run.runId){if(typeof event.data.error==='string')finish({error:event.data.error});else if(Array.isArray(event.data.results))finish({results:event.data.results,regression:event.data.regression});}});
$('#code').addEventListener('input',changed);$('#hypothesis').addEventListener('input',changed);$('#custom').addEventListener('input',changed);
$('#hint').onclick=async()=>{
 const r=record();if(active.transfer||mentorController)return;
 const taskId=active.id;const snapshot={code:r.code,custom:r.custom,hypothesis:r.hypothesis,runAt:r.runs.at(-1)?.at};
 const controller=new AbortController();mentorController=controller;
 $('#hint').disabled=true;$('#hint').textContent='Preparing a question…';
 const timeout=setTimeout(()=>controller.abort(),32000);
 try {
  const result=await requestMentor(mentorInput(active,r),{signal:controller.signal});
  if(active.id!==taskId)return;
  if(record().code!==snapshot.code||record().custom!==snapshot.custom||record().hypothesis!==snapshot.hypothesis||record().runs.at(-1)?.at!==snapshot.runAt){
   renderMentor({mode:'guided',stage:'stale',message:'Your working context changed while the question was being prepared. Run the current version and ask again.'});return;
  }
  renderMentor(result);
  if(result.stage==='hint'){
   r.hints++;
   (r.mentorHistory??=[]).push({at:new Date().toISOString(),...result});
   if(r.mentorHistory.length>20)r.mentorHistory.shift();save();
  }
 }catch(error){
  if(active.id===taskId)renderMentor({mode:'guided',stage:'unavailable',message:error.name==='AbortError'?'The mentor service took too long. Continue inspecting the tests and try again.':error.message});
 }finally{
  clearTimeout(timeout);
  if(mentorController===controller){mentorController=null;$('#hint').disabled=!!active.transfer;$('#hint').textContent='Help me investigate →';}
 }
};
$('#next').onclick=()=>selectTask(tasks.find(t=>t.id===active.next));
$('#export').onclick=()=>{const report={project:'FixFirst',schemaVersion:1,exportedAt:new Date().toISOString(),disclosure:'Self-reported browser-local practice evidence. Editable by its owner. No identity verification, tamper resistance, or hiring certification. No measured employment outcomes.',provenance:{scope:'Per-task; see tasks[].taskProvenance',authoredFixtures:provenance},metrics:{scope:'This device only',networkAnalytics:false},tasks:tasks.map(t=>({id:t.id,title:t.title,skill:t.skill,taskProvenance:t.provenance||provenance,...state[t.id]}))};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='fixfirst-work-sample.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#reset').onclick=()=>{if(confirm('Reset all FixFirst progress saved on this device? Export your work sample first if you want to keep it.')){state={};save();selectTask(tasks[0]);}};
selectTask(active);
