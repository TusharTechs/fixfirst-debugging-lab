import {pipeline,env} from '@huggingface/transformers';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const spec=JSON.parse(await readFile(new URL('./model.json',import.meta.url),'utf8'));
const cache=fileURLToPath(new URL('../.model-cache/',import.meta.url));
env.cacheDir=cache;
let generator;
export async function load({download=false}={}) {
 if(!download)env.fetch=async()=>{throw new Error('Remote requests are disabled during cached mentor inference')};
 const source=download?spec.id:path.join(cache,spec.id,spec.revision);
 generator??=pipeline('text-generation',source,{revision:spec.revision,dtype:spec.dtype,device:spec.device,cache_dir:cache,local_files_only:!download});
 return generator;
}
export async function infer(messages) {
 const pipe=await load();
 const result=await pipe(messages,{max_new_tokens:spec.maxNewTokens,do_sample:false,return_full_text:false});
 const text=result[0]?.generated_text;
 return typeof text==='string'?text:text?.at(-1)?.content||'';
}
