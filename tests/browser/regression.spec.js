import {test,expect} from '@playwright/test';
const fix='function exportInvoices(invoices) { return invoices.filter(i => Number.isFinite(i.balance)); }';
const meaningful={args:[[{id:'paid',balance:0}]],expected:[{id:'paid',balance:0}]};
const vacuous={args:[[{id:'due',balance:3}]],expected:[{id:'due',balance:3}]};
async function prepare(page){
 await page.goto('/');await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText('1/3 PASS');
 await page.locator('#hypothesis').fill('Truthiness drops valid zero balances; finite numeric balances should be retained.');await page.locator('#code').fill(fix);
}
async function runCase(page,custom){await page.locator('#custom').fill(JSON.stringify(custom));await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText('4/4 PASS');}
test('case must catch original bug and changing case invalidates its evidence',async({page})=>{
 await prepare(page);await runCase(page,meaningful);await expect(page.locator('#status')).toHaveText('Evidence captured');
 await page.locator('#custom').fill(JSON.stringify(vacuous));await expect(page.locator('#status')).toHaveText('Unverified');
 await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText('4/4 PASS');await expect(page.locator('#status')).toHaveText('Tests pass');await expect(page.locator('#milestone')).toContainText('also passes on the original');
 await page.reload();await expect(page.locator('#status')).toHaveText('Tests pass');await expect(page.locator('#next')).toBeHidden();
});
test('legacy boolean and regression map do not qualify a vacuous case',async({page})=>{
 await prepare(page);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('fixfirst-v1'));s.invoice.baselineRegression=true;s.invoice.regressions={'{"args":[[{"id":"due","balance":3}]],"expected":[{"id":"due","balance":3}]}':{failedOnOriginal:true}};localStorage.setItem('fixfirst-v1',JSON.stringify(s));});
 await page.reload();await runCase(page,vacuous);await expect(page.locator('#status')).toHaveText('Tests pass');
});
// Test the runner protocol directly to exercise original-code evaluation failures.
async function execute(page,request){
 return page.evaluate(request=>new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.src='/runner.html';
  const id=crypto.randomUUID();let timer;
  const cleanup=()=>{clearTimeout(timer);removeEventListener('message',onMessage);frame.remove();};
  const onMessage=e=>{if(e.source!==frame.contentWindow)return;if(e.data?.type==='runner-ready')frame.contentWindow.postMessage({type:'execute',runId:id,...request},'*');if(e.data?.type==='execution-result'&&e.data.runId===id){cleanup();resolve(e.data);}};
  addEventListener('message',onMessage);timer=setTimeout(()=>{cleanup();reject(Error('Runner did not complete'));},4000);document.body.append(frame);
 }),request);
}
test('original syntax error and timeout never establish a failing regression',async({page})=>{
 await page.goto('/');
 const req={code:'function identity(x){return x}',entry:'identity',tests:[{name:'suite',args:[1],expected:1}],custom:{args:[2],expected:2}};
 const syntax=await execute(page,{...req,originalCode:'function {'});expect(syntax.regression.original).toBe('error');expect(syntax.regression.repaired).toBe('passed');
 const timeout=await execute(page,{...req,originalCode:'function identity(){while(true){}}'});expect(timeout.regression.original).toBe('error');expect(timeout.regression.error).toContain('timed out');
});
test('repaired regression exception or timeout cannot pass',async({page})=>{
 await page.goto('/');const req={originalCode:'function identity(x){return 0}',entry:'identity',tests:[{name:'suite',args:[1],expected:1}],custom:{args:[2],expected:2}};
 const thrown=await execute(page,{...req,code:'function identity(x){if(x===2)throw Error("regression error");return x}'});expect(thrown.regression.repaired).toBe('error');expect(thrown.results.at(-1).passed).toBe(false);
 const timeout=await execute(page,{...req,code:'function identity(x){if(x===2)while(true){};return x}'});expect(timeout.error).toContain('Regression evaluation failed');
});
