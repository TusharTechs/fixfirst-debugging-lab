// Allowlisted case recipes construct values JSON cannot express (identity, cycles, callbacks).
// Self-contained so the same function can run inside the disposable browser worker and Docker.
export async function runScenario(fn, test) {
  const args=test.args;
  const reasonFor=name=>{
    const reasons={undefined:undefined,null:null,false:false,zero:0,empty:'',nan:NaN,error:new Error('deliberate failure')};
    if (!Object.hasOwn(reasons,name)) throw new Error('Unknown rejection reason recipe');
    return reasons[name];
  };
  if (test.scenario==='promise-rejection') {
    const reason=reasonFor(args[0]), count=args[1]??2;
    if (!Number.isInteger(count)||count<1||count>8) throw new Error('Caller count must be 1–8');
    let calls=0;
    const debounced=fn.promise(async mode=>{calls++;if(mode==='reject')throw reason;return 'recovered';});
    const settled=await Promise.allSettled(Array.from({length:count},()=>debounced('reject')));
    const recovered=await debounced('recover');
    return {statuses:settled.map(r=>r.status),reasonPreserved:settled.every(r=>r.status==='rejected'&&Object.is(r.reason,reason)),recovered,calls};
  }
  if (test.scenario==='promise-concurrent') {
    let release,calls=0;
    const gate=new Promise(resolve=>{release=resolve});
    const debounced=fn.promise(async value=>{calls++;await gate;return value});
    const pending=args.map(value=>debounced(value));release();
    return {values:await Promise.all(pending),calls};
  }
  if (test.scenario==='promise-queued-rejection') {
    const reason=reasonFor(args[0]);let release,calls=0;
    const gate=new Promise(resolve=>{release=resolve});
    const debounced=fn.promise(async value=>{calls++;if(value==='first'){await gate;throw reason}return value},{after:true});
    const pending=Promise.allSettled([debounced('first'),debounced('middle'),debounced('latest')]);release();
    const results=await pending;const recovered=await debounced('recover');
    return {statuses:results.map(r=>r.status),reasonPreserved:results[0].status==='rejected'&&Object.is(results[0].reason,reason),queued:results.slice(1).map(r=>r.value),recovered,calls};
  }
  if (test.scenario==='serialize-graph') {
    const [kind,value,options]=args;
    let input;
    if (kind==='shared-object'||kind==='shared-array') {
      if (!value||typeof value!=='object') throw new Error('Shared value must be an object or array');
      input=kind==='shared-object'?{a:value,b:value}:[value,value];
    } else if (kind==='cycle') {
      input={a:1};input.self=input;
    } else throw new Error('Unknown object graph recipe');
    // An observed library exception is data here, not a harness/compilation failure.
    try {return {status:'returned',value:fn(input,options)}}
    catch(error){return {status:'threw',errorType:error?.name||typeof error}}
  }
  throw new Error('Unknown case recipe');
}
