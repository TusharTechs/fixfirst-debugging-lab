const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search),form=params.get('form')==='B'?'B':'A';
let packet=null,active=null,state={},run=null;
$('#assessment-start').textContent='Start form '+form;$('#assessment-form').textContent='Form '+form+' · no coaching';
$('#other-form').textContent='Preview form '+(form==='A'?'B':'A');$('#other-form').href='/assessment.html?form='+(form==='A'?'B':'A');
async function api(path,body){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await response.json();if(!response.ok)throw Error(value.error);return value}
function save(){if(!packet)return;try{localStorage.setItem('fixfirst-assessment-'+packet.bankHash+'-'+form,JSON.stringify(state))}catch{$('#assessment-message').textContent='Local storage unavailable; keep this page open and export before leaving.'}}
function draft(){return state[active.id]??={code:active.code,reason:'',custom:'',runs:[],openedAt:new Date().toISOString()}}
function edit(){const d=draft();d.code=$('#code').value;d.reason=$('#assessment-reason').value;d.custom=$('#assessment-custom').value;save()}
function select(task){active=task;const d=draft();$('#assessment-title').textContent=task.title;$('#assessment-contract').textContent=task.contract;$('#assessment-family').textContent=task.exploratory?'Exploratory unpractised task · analysed separately':'Transfer family: '+task.family;$('#assessment-file').textContent=task.file;$('#code').value=d.code;$('#assessment-reason').value=d.reason;$('#assessment-custom').value=d.custom;$('#assessment-count').textContent='—';$('#assessment-results').textContent='Run the visible example. Hidden grading cases are not downloaded.';const nav=$('#assessment-nav');nav.replaceChildren();packet.tasks.forEach((t,i)=>{const button=document.createElement('button');button.className='task'+(t.id===task.id?' active':'');button.textContent=String(i+1).padStart(2,'0')+'  '+t.title;button.onclick=()=>{if(!run)select(t)};nav.append(button)});save()}
$('#assessment-start').onclick=async()=>{
 $('#assessment-start').disabled=true;
 try{
  packet=await api('/api/assessment/begin',{form,phase:params.get('phase')||'preview',allocationCode:params.get('code')});
  try{state=JSON.parse(localStorage.getItem('fixfirst-assessment-'+packet.bankHash+'-'+form)||'{}')}catch{state={}}
  $('#assessment-intro').hidden=true;$('#assessment-workspace').hidden=false;$('#assessment-export').disabled=false;$('#assessment-version').textContent=packet.version+' / '+packet.bankHash.slice(0,12);select(packet.tasks[0]);
 }catch(error){$('#assessment-message').textContent=error.message;$('#assessment-start').disabled=false}
};
for(const id of ['code','assessment-reason','assessment-custom'])$('#'+id).addEventListener('input',edit);
function finish(result){if(!run)return;clearTimeout(run.timer);run.frame.remove();const d=draft();d.runs.push({at:new Date().toISOString(),code:run.code,...result});if(d.runs.length>30)d.runs.shift();run=null;$('#assessment-run').disabled=false;$('#assessment-export').disabled=false;const box=$('#assessment-results');box.replaceChildren();if(result.error){box.textContent=result.error;$('#assessment-count').textContent='ERROR'}else{const passed=result.results.filter(r=>r.passed).length;$('#assessment-count').textContent=passed+'/'+result.results.length+' PASS';for(const row of result.results){const p=document.createElement('p');p.className='test-result '+(row.passed?'pass':'fail');p.textContent=(row.passed?'✓ ':'× ')+row.name+'\nExpected: '+row.expected+'\nObserved: '+row.actual;box.append(p)}}save()}
$('#assessment-run').onclick=()=>{if(run)return;edit();$('#assessment-run').disabled=true;$('#assessment-export').disabled=true;const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.src='/runner.html';const id=crypto.randomUUID();run={id,frame,code:draft().code,request:{type:'execute',runId:id,code:draft().code,originalCode:active.code,entry:'solve',format:'esm-named',tests:active.examples,custom:null},timer:setTimeout(()=>finish({error:'Execution timed out.'}),3000)};document.body.append(frame)};
addEventListener('message',event=>{if(!run||event.source!==run.frame.contentWindow)return;if(event.data?.type==='runner-ready')run.frame.contentWindow.postMessage(run.request,'*');if(event.data?.type==='execution-result'&&event.data.runId===run.id){if(typeof event.data.error==='string')finish({error:event.data.error});else if(Array.isArray(event.data.results))finish({results:event.data.results})}});
$('#assessment-export').onclick=async()=>{
 if(!packet||run)return;edit();const tasks=[];
 for(const task of packet.tasks){const d=state[task.id]||{code:task.code,reason:'',custom:'',runs:[]};let custom=null;try{custom=d.custom.trim()?JSON.parse(d.custom):null;if(custom&&(!Array.isArray(custom.args)||!Object.hasOwn(custom,'expected')))throw Error()}catch{$('#assessment-message').textContent='Invalid regression JSON for '+task.title;return}tasks.push({taskId:task.id,code:d.code,reason:d.reason,custom,runs:d.runs,attempted:d.runs.length>0||d.code!==task.code||d.reason.trim().length>0,openedAt:d.openedAt||null})}
 let endedOnServer=false;let session={...packet.session,endedAt:new Date().toISOString(),clockSource:'browser-fallback'};try{const ended=await api('/api/assessment/end',{});endedOnServer=true;if(ended.session)session={...ended.session,clockSource:'local-server'}}catch{}
 const exported={kind:'fixfirst-assessment',version:packet.version,bankHash:packet.bankHash,session,tasks,disclosure:'Locally editable work sample. No identity or unaided-work verification. Visible examples are not final grading.'};const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='fixfirst-assessment-'+form+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#assessment-workspace').hidden=true;$('#assessment-export').disabled=true;$('#assessment-message').textContent=endedOnServer?'Assessment exported and ended. Coaching is available again. The operator must grade this export separately.':'Assessment exported locally, but the server could not confirm ending the session. Reconnect before returning to coaching.';
};

$('#assessment-stop').onclick=async()=>{
 if(!packet)return;
 if(!confirm('End this assessment and remove this form’s saved drafts from this browser? Previously exported or shared files will remain.'))return;
 if(run){clearTimeout(run.timer);run.frame.remove();run=null}
 let ended=false;try{await api('/api/assessment/end',{});ended=true}catch{}
 try{localStorage.removeItem('fixfirst-assessment-'+packet.bankHash+'-'+form)}catch{}
 state={};packet=null;active=null;$('#code').value='';$('#assessment-reason').value='';$('#assessment-custom').value='';$('#assessment-workspace').hidden=true;$('#assessment-export').disabled=true;$('#assessment-title').textContent='Assessment ended';
 $('#assessment-message').textContent=ended?'Assessment ended without export. This form’s local drafts were removed. No file was created; coaching is available again.':'Local drafts removed without export. The server could not confirm ending the session; reconnect before returning to coaching.';
};
