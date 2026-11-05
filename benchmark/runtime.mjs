// Runs only in an isolated container. Expected answers are NEVER sent here.
const write=process.stdout.write.bind(process.stdout);
const stringify=JSON.stringify.bind(JSON),parse=JSON.parse.bind(JSON),clone=structuredClone;
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=parse(input);
const outputs=[];
try {
 const fn=(await import('./candidate.mjs')).solve;
 if(typeof fn!=='function')throw Error('Export a solve function');
 for(const item of request.cases){
  const args=clone(item.args),before=stringify(args);
  try {
   const value=await fn(...args);
   outputs.push(value===undefined?{status:'undefined'}:{status:'returned',value:parse(stringify(value)),mutated:before!==stringify(args)});
  }catch(error){outputs.push({status:'threw',errorType:String(error?.name||typeof error).slice(0,80)});}
 }
 write(stringify({nonce:request.nonce,outputs}));
}catch(error){write(stringify({nonce:request.nonce,error:'Unable to load candidate: '+String(error?.message??error).slice(0,240)}));}
