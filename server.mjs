import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {bank,publicTask} from './benchmark/tasks.mjs';
import {verifyFreeze} from './benchmark/grader.mjs';
import {coach,coachBaseline} from './mentor/policy.mjs';
import {plan,closeModel} from './mentor/model-pool.mjs';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const routes = {'/':'index.html','/app.js':'app.js','/style.css':'style.css','/tasks.js':'tasks.js','/runner.html':'runner.html','/repository-task.js':'repository-task.js',
 '/corpus/url-join-fragment/source.js':'corpus/url-join-fragment/source.js',
 '/corpus/url-join-fragment/manifest.json':'corpus/url-join-fragment/manifest.json',
 '/corpus/url-join-fragment/LICENSE':'corpus/url-join-fragment/LICENSE',
 '/corpus/url-join-fragment/README.md':'corpus/url-join-fragment/README.md',
 '/corpus/url-join-fragment/upstream-tests.js':'corpus/url-join-fragment/upstream-tests.js'};
for (const name of ['additional-tasks.js','scenarios.js','mentor-client.js','assessment.html','assessment.js']) routes['/'+name]=name;
for (const id of ['debounce-rejection','stringify-shared-reference']) {
 for (const file of ['source.js','manifest.json','LICENSE','README.md','upstream-tests.js']) {
  const asset='corpus/'+id+'/'+file;routes['/'+asset]=asset;
 }
}
const types={html:'text/html',js:'text/javascript',css:'text/css',json:'application/json',md:'text/plain',LICENSE:'text/plain'};
function readJSON(req) {
 return new Promise((resolve,reject)=>{
  let bytes=0,failed=false;const chunks=[];
  const fail=error=>{if(!failed){failed=true;reject(error)}};
  req.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536){fail(Object.assign(new Error('Request too large'),{status:413}));return;}if(!failed)chunks.push(chunk)});
  req.on('end',()=>{if(failed)return;try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{fail(Object.assign(new Error('Invalid JSON'),{status:400}))}});
  req.on('error',()=>fail(Object.assign(new Error('Request interrupted'),{status:400})));
 });
}
export function createApp({provider=plan,maxHintsPerMinute=8,coachMode=process.env.FIXFIRST_COACH_MODE||'local-model'}={}) {
 if(!['local-model','guided-baseline'].includes(coachMode))throw Error('Unknown coaching mode');
 let requests=[];const assessmentSessions=new Map();
 const server=http.createServer(async(req,res)=>{
  const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))};
  const host=req.headers.host||'';
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return json(403,{error:'Local host required'});
  const url=new URL(req.url,'http://'+host);
  const cookies=Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(part=>part.trim().split('=')));
  if(url.pathname==='/api/mentor/config'&&req.method==='GET')return json(200,{mode:coachMode});
  if(['/api/assessment/begin','/api/assessment/end'].includes(url.pathname)) {
   if(req.method!=='POST')return json(405,{error:'Use POST'});
   if(req.headers.origin!=='http://'+host)return json(403,{error:'Same-origin request required'});
   if((req.headers['content-type']||'').split(';')[0]!=='application/json')return json(415,{error:'Use application/json'});
   try {
    const input=await readJSON(req);
    if(url.pathname.endsWith('/end')){
     const session=assessmentSessions.get(cookies.fixfirst_assessment);assessmentSessions.delete(cookies.fixfirst_assessment);
     res.setHeader('Set-Cookie','fixfirst_assessment=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
     return json(200,{session:session?{...session,endedAt:new Date().toISOString()}:null});
    }
    if(!['A','B'].includes(input.form))return json(400,{error:'Choose form A or B'});
    for(const [id,session]of assessmentSessions)if(Date.now()-session.startedMs>7200000)assessmentSessions.delete(id);
    if(assessmentSessions.size>=128)return json(429,{error:'Assessment session limit reached'});
    const frozen=await verifyFreeze();
    const phase=['pretest','posttest','preview'].includes(input.phase)?input.phase:'preview';
    const allocationCode=typeof input.allocationCode==='string'&&/^[a-zA-Z0-9-]{1,32}$/.test(input.allocationCode)?input.allocationCode:null;
    const token=randomUUID();const session={id:randomUUID(),form:input.form,phase,allocationCode,startedAt:new Date().toISOString(),startedMs:Date.now()};
    if(cookies.fixfirst_assessment)assessmentSessions.delete(cookies.fixfirst_assessment);
    assessmentSessions.set(token,session);res.setHeader('Set-Cookie','fixfirst_assessment='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200');
    return json(200,{version:frozen.version,bankHash:frozen.bankHash,session,tasks:bank.filter(t=>t.form===input.form).map(publicTask)});
   }catch(error){return json(error.status||400,{error:error.status===413?'Request too large':'Assessment bank unavailable or invalid request'})}
  }
  if(url.pathname==='/api/mentor') {
   if(req.method!=='POST')return json(405,{error:'Use POST'});
   if(req.headers.origin!=='http://'+host)return json(403,{error:'Same-origin request required'});
   if((req.headers['content-type']||'').split(';')[0]!=='application/json')return json(415,{error:'Use application/json'});
   if(cookies.fixfirst_assessment)return json(200,{mode:'guided',stage:'transfer',message:'Coaching is disabled while an assessment is active, including requests labelled as practice. Export and end the assessment before returning to coaching.',evidence:[]});
   const now=Date.now();requests=requests.filter(time=>time>now-60000);
   if(requests.length>=maxHintsPerMinute)return json(429,{error:'Mentor request limit reached. Wait a minute and continue investigating.'});
   requests.push(now);
   try {const input=await readJSON(req);return json(200,coachMode==='guided-baseline'?coachBaseline(input):await coach(input,provider))}
   catch(error){return json(error.status||400,{error:error.status===413?'Request too large':'Invalid mentor context or incomplete execution evidence'})}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Read-only resource'});
  const file=routes[url.pathname];
  if(!file){res.writeHead(404);return res.end('Not found');}
  try {const body=await readFile(root+file);res.writeHead(200,{'Content-Type':(types[file.split('.').pop()]||'text/plain')+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body)}
  catch {res.writeHead(500);res.end('Unable to load resource')}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const port=Number(process.env.PORT||4173);
 const server=createApp();server.listen(port,'127.0.0.1',()=>console.log('FixFirst: http://127.0.0.1:'+port));
 const stop=()=>{closeModel();server.close(()=>process.exit(0))};
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
