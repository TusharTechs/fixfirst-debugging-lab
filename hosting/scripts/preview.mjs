import http from 'node:http';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const{default:worker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const response=await worker.fetch(new Request('http://127.0.0.1:4180'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),{FIXFIRST_SIGNING_KEY:process.env.FIXFIRST_SIGNING_KEY,FIXFIRST_SERVICE_URL:process.env.FIXFIRST_SERVICE_URL});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Preview failed')}}).listen(4180,'127.0.0.1',()=>console.log('FixFirst hosted preview: http://127.0.0.1:4180'));
