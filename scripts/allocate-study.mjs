import {createHash,randomBytes} from 'node:crypto';import {writeFile} from 'node:fs/promises';import {verifyFreeze} from '../benchmark/grader.mjs';
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]},slots=Number(get('--slots'));
if(!Number.isInteger(slots)||slots<4||slots>1000||slots%4!==0)throw Error('Use --slots with a multiple of four from 4 to 1000. This creates planned slots, not participants.');
const seed=get('--seed')||randomBytes(24).toString('hex');let counter=0;const random=()=>createHash('sha256').update(seed+':'+counter++).digest().readUInt32BE(0)/4294967296;
const planned=[];for(let block=0;block<slots/4;block++){
 const choices=[['local-model','A','B'],['local-model','B','A'],['guided-baseline','A','B'],['guided-baseline','B','A']];
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}
 for(const [arm,pretestForm,posttestForm]of choices)planned.push({code:'slot-'+String(planned.length+1).padStart(3,'0'),block,arm,pretestForm,posttestForm});
}
const frozen=await verifyFreeze();const result={kind:'planned-study-allocation',plannedOnly:true,version:frozen.version,bankHash:frozen.bankHash,seed,slots:planned,disclosure:'No participants enrolled. Keep real allocation schedules operator-controlled until assignment; this file is not outcome data.'};
if(get('--out'))await writeFile(get('--out'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
