import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {additionalTasks} from '../../public/additional-tasks.js';
for(const task of additionalTasks)test(task.id+' reproduces bug, passes repair and validates meaningful custom recipe',async({page})=>{
 await page.goto('/?task='+task.id);
 await expect(page.locator('#title')).toHaveText(task.title);
 await expect(page.locator('#custom-help')).toContainText(task.id==='debounce-rejection'?'Promise recipes':'serialize-graph');
 await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText(task.id==='debounce-rejection'?'2/9 PASS':'5/8 PASS');
 await page.locator('#hypothesis').fill(task.id==='debounce-rejection'?'The promise code tests rejection reason truthiness instead of tracking rejection as a separate state.':'The visited set retains completed child nodes and mistakes later references for an ancestor cycle.');
 const fixed=await readFile(new URL('../../corpus/'+task.id+'/reference/'+task.file,import.meta.url),'utf8');
 await page.locator('#code').fill(fixed);await page.locator('#custom').fill(JSON.stringify(task.regressionExample));
 await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText((task.tests.length+1)+'/'+(task.tests.length+1)+' PASS');await expect(page.locator('#status')).toHaveText('Evidence captured');
 // A control case that works on the buggy original cannot inherit the prior evidence.
 const control=task.id==='debounce-rejection'?{scenario:'promise-concurrent',args:[1,2],expected:{values:[1,1],calls:1}}:{scenario:'serialize-graph',args:['cycle',null],expected:{status:'threw',errorType:'TypeError'}};
 await page.locator('#custom').fill(JSON.stringify(control));await expect(page.locator('#status')).toHaveText('Unverified');await page.locator('#run').click();await expect(page.locator('#status')).toHaveText('Tests pass');await expect(page.locator('#milestone')).toContainText('also passes on the original');
});
test('unsupported recipe is rejected and both new task views fit mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const task of additionalTasks){await page.goto('/?task='+task.id);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#custom').fill('{"scenario":"arbitrary-script","args":[],"expected":null}');await page.locator('#run').click();await expect(page.locator('.runner-error')).toContainText('recipe supported by this task');
});
test('CommonJS candidate cannot acquire Node host modules in browser',async({page})=>{
 await page.goto('/?task=stringify-shared-reference');await page.locator('#code').fill('module.exports = require("node:fs").readFileSync;');await page.locator('#run').click();await expect(page.locator('.runner-error')).toContainText('no require() dependencies');
});
test('async candidate that never settles times out without evidence',async({page})=>{
 await page.goto('/?task=debounce-rejection');await page.locator('#code').fill('const never=()=>new Promise(()=>{});never.promise=()=>never;export default never;');await page.locator('#run').click();await expect(page.locator('.runner-error')).toContainText('timed out',{timeout:5000});await expect(page.locator('#status')).toHaveText('Unverified');
});
