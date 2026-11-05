const json=(status,value,extra={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
async function body(request,limit=65536){
 if((request.headers.get('content-type')||'').split(';')[0]!=='application/json')throw Object.assign(Error('Use application/json'),{status:415});
 if(Number(request.headers.get('content-length'))>limit)throw Object.assign(Error('Request too large'),{status:413});
 const reader=request.body?.getReader();if(!reader)throw Error('Missing JSON body');let size=0;const chunks=[];
 while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Object.assign(Error('Request too large'),{status:413})}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes));
}
export default {async fetch(request,env={}){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/mentor/config'&&request.method==='GET')return json(200,{mode:env.FIXFIRST_SERVICE_URL&&env.FIXFIRST_SIGNING_KEY?'hosted-model':'guided-baseline',deployment:'hosted-development',modelConfigured:!!(env.FIXFIRST_SERVICE_URL&&env.FIXFIRST_SIGNING_KEY),remoteGraderConfigured:!!(env.FIXFIRST_SERVICE_URL&&env.FIXFIRST_SIGNING_KEY),availability:'Free service queues and quotas apply; each coaching response states the mode actually used.'});
 if(path==='/pilot/config'&&request.method==='GET')return json(200,{...calibration,contact:'tusharaggarwal274@gmail.com',allowHumanCalibration:true,assessmentBase:url.origin,dataHandling:'Browser-local until voluntary manual export; no observation POST endpoint'});
 if(path==='/pilot/tasks'&&request.method==='GET'){
  const form=url.searchParams.get('form');if(!['A','B'].includes(form))return json(400,{error:'Unknown form'});
  return json(200,assessmentTasks.filter(t=>t.form===form).map(({id,title,family,exploratory})=>({id,title,family,exploratory})));
 }
 if(path.startsWith('/api/')){
  if(request.method!=='POST')return json(405,{error:'Use POST'});
  if(request.headers.get('origin')!==url.origin)return json(403,{error:'Same-origin request required'});
  if(!['/api/mentor','/api/assessment/begin','/api/assessment/end','/api/grade'].includes(path))return json(404,{error:'Unknown API'});
  try{
   const input=await body(request,path==='/api/grade'?125000:65536);
   if(!input||typeof input!=='object'||Array.isArray(input))return json(400,{error:'Use an object'});
   if(path==='/api/grade'){
    if(/(?:^|;\s*)fixfirst_assessment=/.test(request.headers.get('cookie')||''))return json(403,{error:'End your active assessment before requesting development feedback.'});
    if(input.consent!==true)return json(400,{error:'Explicit cloud grading acknowledgement required'});
    if(!serviceLimit())return json(429,{error:'Service is busy. Keep your export and try again shortly.'});
    const p=input.packet;
    if(!p||p.kind!=='fixfirst-assessment'||!Array.isArray(p.tasks)||p.tasks.length>4||!['A','B'].includes(p.session?.form))return json(400,{error:'Invalid assessment export'});
    const clean={kind:p.kind,version:p.version,bankHash:p.bankHash,session:{form:p.session.form,phase:'preview'},tasks:p.tasks.map(t=>({taskId:t.taskId,code:t.code,custom:t.custom,attempted:t.attempted}))};
    const report=await remoteCall(env,'grade',clean,{deadline:55000});
    if(report.kind!=='fixfirst-development-grade'||report.notLearnerData!==true)return json(502,{error:'Invalid development grade response'});
    return json(200,report);
   }
   if(path==='/api/assessment/begin'){
    if(!['A','B'].includes(input.form))return json(400,{error:'Choose form A or B'});
    const phase=['pretest','posttest','preview'].includes(input.phase)?input.phase:'preview';
    const allocationCode=typeof input.allocationCode==='string'&&/^[a-zA-Z0-9-]{1,32}$/.test(input.allocationCode)?input.allocationCode:null;
    const session={id:crypto.randomUUID(),form:input.form,phase,allocationCode,startedAt:new Date().toISOString(),startedMs:Date.now()};
    return json(200,{version:calibration.version,bankHash:calibration.bankHash,session,tasks:assessmentTasks.filter(t=>t.form===input.form)},{'Set-Cookie':'fixfirst_assessment=active; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200'});
   }
   if(path==='/api/assessment/end')return json(200,{session:null},{'Set-Cookie':'fixfirst_assessment=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
   if(/(?:^|;\s*)fixfirst_assessment=/.test(request.headers.get('cookie')||''))return json(200,{mode:'guided',stage:'transfer',message:'Coaching is disabled while an assessment is active. End the assessment before returning to coaching.',evidence:[]});
   if(!env.FIXFIRST_SERVICE_URL||!env.FIXFIRST_SIGNING_KEY)return json(200,await coachBaseline(input));
   const prepared=await prepareContext(input);if(prepared.guard)return json(200,prepared.guard);
   if(!serviceLimit())return json(200,renderHint(prepared.context,prepared.context.choices[0],{mode:'guided-fallback',fallbackReason:'busy',provider:null}));
   const result=await coach(input,messages=>remoteCall(env,'plan',messages));
   if(result.mode==='local-model')result.mode='hosted-model';return json(200,result);
  }catch(error){return json(error.code?503:error.status||400,{error:error.code?'Remote service unavailable. Your local export is safe; try again later.':error.status===413?'Request too large':'Invalid coaching context or request'})}
 }
 if(!['GET','HEAD'].includes(request.method))return json(405,{error:'Read-only resource'});
 if(path==='/pilot')return Response.redirect(url.origin+'/pilot/',302);
 const asset=assets[path];if(asset===undefined)return new Response('Not found',{status:404});
 const ext=path.split('.').pop();const type=path.endsWith('/')||ext==='html'?'text/html':ext==='js'?'text/javascript':ext==='css'?'text/css':ext==='json'?'application/json':'text/plain';
 return new Response(request.method==='HEAD'?null:asset,{headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}};
