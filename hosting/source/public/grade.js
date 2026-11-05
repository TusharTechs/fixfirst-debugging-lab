const $=s=>document.querySelector(s);let file=null,report=null,busy=false;
function available(){$('#grade-submit').disabled=busy||!file||!$('#cloud-ack').checked}
$('#assessment-upload').onchange=()=>{file=$('#assessment-upload').files[0]||null;report=null;$('#grade-download').hidden=true;$('#grade-result').hidden=true;$('#cloud-ack').checked=false;available()};$('#cloud-ack').onchange=available;
$('#grade-submit').onclick=async()=>{
 if(busy||!file||!$('#cloud-ack').checked)return;busy=true;available();$('#grade-status').textContent='Checking the export and waiting for the development service. This can take up to a minute.';
 try{
  if(file.size>120000)throw Error('File exceeds 120 KB. Keep your original and export a supported assessment.');
  const p=JSON.parse(await file.text());if(p.kind!=='fixfirst-assessment'||!['A','B'].includes(p.session?.form)||!Array.isArray(p.tasks)||p.tasks.length>4)throw Error('Choose a FixFirst assessment JSON export.');
  // Only source/cases required for execution leave this browser. Never send the
  // diagnosis, allocation code or identifying session metadata to grading.
  const packet={kind:p.kind,version:p.version,bankHash:p.bankHash,session:{form:p.session.form,phase:'preview'},tasks:p.tasks.map(t=>({taskId:t.taskId,code:t.code,custom:t.custom,attempted:t.attempted}))};
  const response=await fetch('/api/grade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,packet}),signal:AbortSignal.timeout(65000)});const result=await response.json();if(!response.ok)throw Error(result.error||'Development service unavailable. Keep your export and try again later.');
  if(result.kind!=='fixfirst-development-grade'||result.notLearnerData!==true||!Array.isArray(result.results))throw Error('Unexpected feedback format. No study result was recorded.');
  report=result;$('#grade-engine').textContent=result.engine+' · '+result.version+' · development data';const box=$('#grade-scores');box.replaceChildren();
  for(const row of result.results){const section=document.createElement('div');section.className='grade-row';const title=document.createElement('h3');title.textContent=row.taskId+(row.exploratory?' · exploratory':'');const score=document.createElement('p');score.textContent=row.missing?'Not attempted · 0/80 automatic points':row.automaticScore+'/80 automatic points · '+(row.allBehaviourPassed?'all private behaviour cases passed':'some behaviour cases did not pass');const regression=document.createElement('p');regression.className='muted small';regression.textContent=row.regression?.valid?'New regression catches the original bug and passes the repair.':'Meaningful regression not established.';section.append(title,score,regression);box.append(section)}
  $('#grade-result').hidden=false;$('#grade-download').hidden=false;$('#grade-status').textContent='Development feedback received. Download it if you want to keep it; nothing was emailed or added to a study.';
 }catch(error){$('#grade-status').textContent=error.name==='TimeoutError'?'Service timed out. Your original export is unchanged. Keep it and try again later.':error.message}
 finally{busy=false;available()}
};
$('#grade-download').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='fixfirst-development-feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
