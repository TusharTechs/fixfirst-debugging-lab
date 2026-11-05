import {readFile,writeFile} from 'node:fs/promises';
import {fingerprint,verifyFreeze} from '../benchmark/grader.mjs';
if(process.argv.includes('--create')){
 const protocol=JSON.parse(await readFile(new URL('../benchmark/protocol.json',import.meta.url),'utf8'));
 const actual=await fingerprint();
 let previous;try{previous=JSON.parse(await readFile(new URL('../benchmark/frozen.json',import.meta.url),'utf8'))}catch{}
 if(previous&&previous.bankHash!==actual.bankHash&&previous.version===protocol.version)throw Error('Bump protocol.version before replacing a changed freeze');
 const result={version:protocol.version,frozenAt:new Date().toISOString(),...actual,scope:'Practice/prompt-excluded development assessment bank. Designer-visible; not guaranteed unseen or secure after source publication.'};
 await writeFile(new URL('../benchmark/frozen.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(result);
}else console.log(await verifyFreeze());
