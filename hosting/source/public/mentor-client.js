export function mentorInput(task,record) {
 const last=record.runs.at(-1);
 return {taskId:task.id,code:record.code,custom:record.custom,hypothesis:record.hypothesis,hints:record.hints,
  run:last?{code:last.code,custom:last.custom,error:last.error,results:last.results}:null};
}
export async function requestMentor(input,{signal}={}) {
 const response=await fetch('/api/mentor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Mentor request failed');return result;
}
export function renderMentor(result) {
 document.querySelector('#coach-message').textContent=result.message;
 const mode=document.querySelector('#mentor-mode');
 mode.textContent=['local-model','hosted-model'].includes(result.mode)?(result.mode==='hosted-model'?'Hosted AI planner · ':'Local AI planner · ')+(result.provider?.model?.split('/').pop()||'prepared model')+' · approved coaching prompts':result.mode==='guided-baseline'?'Guided coach · no model':result.mode==='guided-fallback'?'Guided fallback · '+(result.fallbackReason||'model unavailable'):'Guided coaching · '+result.stage;
 const box=document.querySelector('#mentor-evidence');box.replaceChildren();
 if(result.evidence?.length){
  const label=document.createElement('p');label.className='eyebrow';label.textContent='BASED ON YOUR LAST RUN';box.append(label);
  for(const item of result.evidence){
   const p=document.createElement('p');p.className='mentor-citation';
   const title=document.createElement('strong');title.textContent=item.name+(item.passed?' · passed':' · failed');
   const output=document.createElement('pre');output.textContent='Expected: '+item.expected+'\nObserved: '+item.actual;
   p.append(title,output);box.append(p);
  }
  const note=document.createElement('p');note.className='muted small';note.textContent='Browser-reported practice evidence; not independently certified.';box.append(note);
 }
 if(result.sourceWindow?.length){const pre=document.createElement('pre');pre.className='mentor-source';pre.textContent=result.sourceWindow.map(line=>line.line+'  '+line.text).join('\n');box.append(pre)}
}
