import http from 'node:http';import {readFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {bank} from '../benchmark/tasks.mjs';import {verifyFreeze} from '../benchmark/grader.mjs';import {protocol,policyHash} from '../pilot/calibration.mjs';
const root=new URL('../',import.meta.url);
export async function getPilotConfig(){
 let contact=null;try{const local=JSON.parse(await readFile(new URL('pilot/local-config.json',root),'utf8'));if(typeof local.contact==='string'&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(local.contact))contact=local.contact}catch{}
 const frozen=await verifyFreeze();return {contact,allowHumanCalibration:!!contact,version:frozen.version,bankHash:frozen.bankHash,policyVersion:protocol.version,policyHash,informationVersion:protocol.participantInformationVersion,assessmentBase:'http://127.0.0.1:4173',dataHandling:'Browser-local until voluntary manual export; no observation POST endpoint'};
}
export function createPilotServer(){
 const routes={'/':['pilot/index.html','text/html'],'/app.js':['pilot/app.js','text/javascript'],'/style.css':['public/style.css','text/css'],'/pilot.css':['pilot/style.css','text/css']};
 return http.createServer(async(req,res)=>{
  const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host||''))return json(403,{error:'Local host required'});
  if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'This portal receives no participant records'});
  const url=new URL(req.url,'http://'+req.headers.host);
  try{
   if(url.pathname==='/config')return json(200,await getPilotConfig());
   if(url.pathname==='/tasks'){const form=url.searchParams.get('form');if(!['A','B'].includes(form))return json(400,{error:'Unknown form'});return json(200,bank.filter(t=>t.form===form).map(({id,title,family,exploratory})=>({id,title,family,exploratory})))}
   const asset=routes[url.pathname];if(!asset)return json(404,{error:'Not found'});
   const data=await readFile(new URL(asset[0],root));res.writeHead(200,{'Content-Type':asset[1]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
  }catch{return json(503,{error:'Pilot setup unavailable; verify the benchmark freeze and local configuration'})}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.FIXFIRST_PILOT_PORT||4175);createPilotServer().listen(port,'127.0.0.1',()=>console.log('FixFirst calibration portal: http://127.0.0.1:'+port))}
