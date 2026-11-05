import {load,spec,infer} from '../mentor/local-model.mjs';
console.log('Downloading/caching public model '+spec.id+' at '+spec.revision+' ('+spec.dtype+'). Prompts are not sent to Hugging Face.');
await load({download:true});
console.log('Local warmup:',await infer([{role:'user',content:'Reply with only the digit 1.'}]));
console.log('Mentor model ready. Subsequent inference uses cached files only.');
