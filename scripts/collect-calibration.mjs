import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
try{
 for(const key of ['--observations','--grades','--out-dir'])if(!get(key))throw Error('Use --observations directory --grades directory --out-dir separate-directory');
 const out=path.resolve(get('--out-dir'));if([get('--observations'),get('--grades')].some(p=>path.resolve(p)===out))throw Error('Output directory must be separate from input directories');
 const manifests=[];
 async function collect(directory,kind){const records=[];for(const name of (await readdir(directory)).filter(n=>n.endsWith('.json')).sort()){const text=await readFile(path.join(directory,name),'utf8');if(Buffer.byteLength(text)>1000000)throw Error('Oversized calibration file: '+name);const value=JSON.parse(text);if(value.kind!==kind)throw Error('Wrong record kind in '+name);records.push(value);manifests.push({name,kind,sha256:createHash('sha256').update(text).digest('hex')})}return records}
 const observations=await collect(get('--observations'),'fixfirst-calibration-observation'),grades=await collect(get('--grades'),'fixfirst-assessment-grade');
 await mkdir(out,{recursive:true});await writeFile(path.join(out,'observations.json'),JSON.stringify(observations,null,2)+'\n');await writeFile(path.join(out,'grades.json'),JSON.stringify(grades,null,2)+'\n');await writeFile(path.join(out,'batch-manifest.json'),JSON.stringify({kind:'calibration-file-batch',at:new Date().toISOString(),files:manifests,disclosure:'Collected files are not automatically eligible human observations. Run pilot:check before interpreting.'},null,2)+'\n');console.log('Collected '+observations.length+' observations and '+grades.length+' grade reports. No records sent to a service.');
}catch(error){console.error(error.message);process.exitCode=1}
