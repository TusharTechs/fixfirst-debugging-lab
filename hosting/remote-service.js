async function remoteCall(env,api,payload,{deadline=25000}={}) {
 if(!env?.FIXFIRST_SERVICE_URL||!env?.FIXFIRST_SIGNING_KEY)throw Object.assign(Error('unavailable'),{code:'unavailable'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),deadline);let reader;
 try{
  const endpoint=env.FIXFIRST_SERVICE_URL.replace(/\/$/,'')+'/gradio_api/call/'+api;
  const payloadText=JSON.stringify(payload),at=Date.now(),nonce=crypto.randomUUID();
  const der=Uint8Array.from(atob(env.FIXFIRST_SIGNING_KEY.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',der,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payloadText))),x=>x.toString(16).padStart(2,'0')).join('');
  const message=at+'\n'+nonce+'\n'+api+'\n'+digest;
  const signature=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(message)))));
  const authorization=JSON.stringify({at,nonce,api,signature});
  const queued=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[authorization,payloadText]}),signal:controller.signal});
  if(!queued.ok)throw Error('unavailable');const packet=await queued.json();
  if(typeof packet.event_id!=='string'||!/^[a-zA-Z0-9-]{8,100}$/.test(packet.event_id))throw Error('unavailable');
  const response=await fetch(endpoint+'/'+packet.event_id,{signal:controller.signal});if(!response.ok||!response.body)throw Error('unavailable');
  reader=response.body.getReader();const decoder=new TextDecoder();let buffer='',total=0;
  while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>65536)throw Error('unavailable');buffer+=decoder.decode(value,{stream:true}).replace(/\r/g,'');
   let end;while((end=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=event.match(/^event:\s*(.+)$/m)?.[1],data=event.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trim()).join('\n');
    if(type==='error')throw Error('unavailable');
    if(type==='complete'){const result=JSON.parse(data);if(!Array.isArray(result)||!result[0]||typeof result[0]!=='object')throw Error('unavailable');return result[0]}
   }
  }
  throw Error('unavailable');
 }catch(error){throw Object.assign(Error('Service unavailable'),{code:controller.signal.aborted?'timeout':'unavailable'})}
 finally{clearTimeout(timer);await reader?.cancel().catch(()=>{})}
}
let recentServiceRequests=[];
function serviceLimit(){const now=Date.now();recentServiceRequests=recentServiceRequests.filter(t=>t>now-60000);if(recentServiceRequests.length>=16)return false;recentServiceRequests.push(now);return true}
