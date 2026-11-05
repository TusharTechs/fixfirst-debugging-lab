import {infer,spec} from './local-model.mjs';
process.on('message',async message=>{
 if(message?.type!=='plan'||typeof message.id!=='string')return;
 try {const text=await infer(message.messages);process.send?.({id:message.id,text,metadata:{model:spec.id,revision:spec.revision,dtype:spec.dtype,maxNewTokens:spec.maxNewTokens}});}
 catch {process.send?.({id:message.id,error:'unavailable'});}
});
