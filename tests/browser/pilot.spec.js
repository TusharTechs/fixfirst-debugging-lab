import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
const base='http://127.0.0.1:4175';
test('pilot consent is not preselected and technical demos remain excluded even when it is checked',async({page})=>{
 const posts=[];page.on('request',r=>{if(r.url().startsWith(base)&&r.method()==='POST')posts.push(r.url())});
 await page.goto(base+'/?form=A');await expect(page.locator('#consent')).not.toBeChecked();await expect(page.locator('#start-real')).toBeDisabled();
 await page.locator('#exposure').selectOption('none');await page.locator('#consent').check();await page.locator('#start-demo').click();await expect(page.locator('#session-source')).toContainText('TECHNICAL DEMO');
 await page.locator('#assess-envelope-status').selectOption('attempted');await page.locator('#assess-envelope-assistance').selectOption('none');await page.locator('#assess-envelope-clarity').selectOption('4');await page.locator('#assess-envelope-minutes').fill('6');
 const pending=page.waitForEvent('download');await page.locator('#export').click();const packet=JSON.parse(await readFile(await(await pending).path(),'utf8'));expect(packet.source).toBe('technical-demo');expect(packet.consent.acknowledged).toBe(false);expect(packet.tasks[0].minutes).toBe(6);expect(packet.tasks[0]).not.toHaveProperty('code');expect(posts).toEqual([]);
 page.on('dialog',dialog=>dialog.accept());await page.locator('#stop').click();await expect(page.locator('#message')).toContainText('Portal draft removed');expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('fixfirst-calibration-')).length)).toBe(0);
});
test('unconfigured contact allows demos only and portal fits mobile',async({page})=>{
 await page.route('**/config',async route=>{const response=await route.fetch();await route.fulfill({json:{...await response.json(),contact:null,allowHumanCalibration:false}})});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/?form=B');await page.locator('#exposure').selectOption('none');await page.locator('#consent').check();await expect(page.locator('#start-real')).toBeDisabled();await page.locator('#start-demo').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('mismatched assessment attachments are rejected without copying source',async({page})=>{
 await page.goto(base+'/?form=A');await page.locator('#start-demo').click();await page.locator('#assessment-file').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({kind:'fixfirst-assessment',bankHash:'wrong',session:{form:'B'}}))});await expect(page.locator('#attachment-status')).toContainText('must match');
});
