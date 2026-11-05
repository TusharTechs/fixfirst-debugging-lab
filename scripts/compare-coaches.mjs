import {chromium} from '@playwright/test';import {writeFile} from 'node:fs/promises';import {verifyFreeze} from '../benchmark/grader.mjs';
const fixtures=[['invoice',0,'Compare the valid zero balance with the passing positive balance.'],['url-join-fragment',2,'I want to trace how the string changes after the second hash.'],['debounce-rejection',0,'Compare a null rejection with the passing Error rejection.'],['stringify-shared-reference',2,'Trace visited objects when two fields share a child.']];
const frozen=await verifyFreeze();const report={kind:'paired-coach-technical-comparison',at:new Date().toISOString(),bankHash:frozen.bankHash,notLearnerData:true,assessmentBankPrompted:false,cases:[]};
const browser=await chromium.launch(),page=await browser.newPage();
try{
 for(const [id,hints,hypothesis]of fixtures){
  await page.goto('http://127.0.0.1:4173/?task='+id);await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#test-count').textContent.includes('PASS'));
  const record=await page.evaluate(id=>JSON.parse(localStorage.getItem('fixfirst-v1'))[id],id);const input={taskId:id,code:record.code,custom:record.custom,hypothesis,hints,run:record.runs.at(-1)};
  const results={};for(const [arm,base]of [['local-model','http://127.0.0.1:4173'],['guided-baseline','http://127.0.0.1:4174']]){const start=performance.now();const response=await fetch(base+'/api/mentor',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(input)});if(!response.ok)throw Error('Comparison server error '+response.status);const hint=await response.json();results[arm]={mode:hint.mode,action:hint.action,message:hint.message,evidenceIds:hint.evidence.map(e=>e.id),elapsedMs:Math.round(performance.now()-start),fallbackReason:hint.fallbackReason};}
  report.cases.push({practiceTaskId:id,results});
 }
 report.decisionsDiffer=report.cases.filter(c=>c.results['local-model'].action!==c.results['guided-baseline'].action).length;
 report.modelFallbacks=report.cases.filter(c=>c.results['local-model'].mode!=='local-model').length;report.learnerEffectEstimate=null;
 report.disclosure='Identical executed public-practice inputs sent to both live local servers. Different decisions or latency do not establish learning improvement. No assessment task or learner outcome was sent to either mentor.';
 const args=process.argv.slice(2),i=args.indexOf('--out');if(i>=0)await writeFile(args[i+1],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
