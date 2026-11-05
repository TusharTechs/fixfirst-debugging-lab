"""One-shot, resource-bounded JS VM. No Python callbacks, module loader or JS I/O."""
import json, sys, time
import quickjs

def run(packet):
    context = quickjs.Context()
    context.set_memory_limit(24 * 1024 * 1024)
    context.set_max_stack_size(256 * 1024)
    context.set_time_limit(0.25)
    # Save intrinsic operations before any learner source executes. The returned
    # poll closure and helper handle never appear in the learner global object.
    make = context.eval(r'''(function(){
      const parse=JSON.parse.bind(JSON), quote=JSON.stringify.bind(JSON), apply=Reflect.apply;
      const isArray=Array.isArray, keys=Object.keys, finite=Number.isFinite;
      function stringify(value,seen=[]) {
        if(value===null||typeof value==='string'||typeof value==='boolean') return quote(value);
        if(typeof value==='number') return finite(value)?quote(value):'null';
        if(typeof value!=='object') throw new Error('Unsupported JSON result');
        for(let i=0;i<seen.length;i++)if(seen[i]===value)throw new Error('Circular result');seen[seen.length]=value;
        let out;
        if(isArray(value)) {out='[';for(let i=0;i<value.length;i++){if(i)out+=',';out+=value[i]===undefined?'null':stringify(value[i],seen)}out+=']'}
        else {out='{';let first=true;const names=keys(value);for(let n=0;n<names.length;n++){const key=names[n],entry=value[key];if(entry===undefined||typeof entry==='function'||typeof entry==='symbol')continue;if(!first)out+=',';first=false;out+=quote(key)+':'+stringify(entry,seen)}out+='}'}
        seen.length--;return out;
      }
      return function(fn,input){
        let output=null;
        const args=parse(input),before=stringify(args);
        (async function(){
          try { const value=await apply(fn,undefined,args);
            output=value===undefined?'{"status":"undefined"}':'{"status":"returned","value":'+stringify(value)+',"mutated":'+(before!==stringify(args))+'}';
          } catch(e){output='{"status":"threw"}'}
        })();
        return function(){return output};
      };
    })()''')
    # No expected values, secrets, scoring code or host callbacks enter this VM.
    name=packet['binding']
    code=packet['code']+'\nglobalThis['+json.dumps(name)+']=solve;'
    context.module(code)
    fn=context.get(name)
    context.eval('delete globalThis['+json.dumps(name)+']')
    if not callable(fn): return {'status':'invalid-export'}
    poll=make(fn,json.dumps(packet['args'],allow_nan=False,separators=(',',':')))
    deadline=time.monotonic()+1
    for _ in range(256):
        result=poll()
        if result is not None:
            if len(result)>16384: return {'status':'output-limit'}
            return json.loads(result)
        if time.monotonic()>deadline or not context.execute_pending_job(): break
    return {'status':'unsettled'}

if __name__=='__main__':
    try:
        request=json.loads(sys.stdin.buffer.read(32769))
        result=run(request)
    except BaseException:
        result={'status':'execution-error'}
    sys.stdout.write(json.dumps(result,allow_nan=False,separators=(',',':')))
