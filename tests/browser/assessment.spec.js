import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
import {bank} from '../../benchmark/tasks.mjs';
test('assessment exposes only examples, blocks all same-origin coaching and exports named-module repairs',async({page})=>{
 await page.goto('/assessment.html?form=A&phase=pretest&code=slot-001');await page.locator('#assessment-start').click();await expect(page.locator('#assessment-title')).toHaveText('Preserve the event payload');
 await page.locator('#assessment-run').click();await expect(page.locator('#assessment-count')).toHaveText('1/1 PASS');
 const response=await page.evaluate(async()=>{const r=await fetch('/api/mentor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:'invoice'})});return r.json()});expect(response.stage).toBe('transfer');
 await page.locator('#code').fill(bank[0].reference);await page.locator('#assessment-reason').fill('The split discards later fields instead of preserving the suffix. A no-delimiter control distinguishes the path.');await page.locator('#assessment-custom').fill(JSON.stringify(bank[0].regression));await page.locator('#assessment-run').click();await expect(page.locator('#assessment-count')).toHaveText('1/1 PASS');
 const pending=page.waitForEvent('download');await page.locator('#assessment-export').click();const downloaded=await pending;const packet=JSON.parse(await readFile(await downloaded.path(),'utf8'));expect(packet.kind).toBe('fixfirst-assessment');expect(packet.tasks).toHaveLength(4);expect(packet.tasks[0].code).toBe(bank[0].reference);expect(packet.session.phase).toBe('pretest');expect(packet.session.allocationCode).toBe('slot-001');expect(packet.session.endedAt).toBeTruthy();
 const unblocked=await page.evaluate(async()=>{const r=await fetch('/api/mentor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:'inventory'})});return r.json()});expect(unblocked.message).not.toContain('while an assessment is active');
});
test('form B validates regression JSON, handles syntax errors and fits mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/assessment.html?form=B');await page.locator('#assessment-start').click();await expect(page.locator('#assessment-title')).toHaveText('Read the value without losing its separator');
 await page.locator('#code').fill('export function solve( {');await page.locator('#assessment-run').click();await expect(page.locator('#assessment-count')).toHaveText('ERROR');
 await page.locator('#assessment-custom').fill('wrong');await page.locator('#assessment-export').click();await expect(page.locator('#assessment-message')).toContainText('Invalid regression JSON');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('end without export removes only this assessment draft and releases coaching',async({page})=>{
 let downloads=0;page.on('download',()=>downloads++);await page.goto('/assessment.html?form=A');await page.locator('#assessment-start').click();
 await page.locator('#assessment-reason').fill('A draft that must be removed when I stop.');await page.evaluate(()=>localStorage.setItem('unrelated-progress','keep'));
 page.on('dialog',dialog=>dialog.accept());await page.locator('#assessment-stop').click();await expect(page.locator('#assessment-message')).toContainText('ended without export');
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('fixfirst-assessment-')).length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('unrelated-progress'))).toBe('keep');expect(downloads).toBe(0);
 const result=await page.evaluate(async()=>{const r=await fetch('/api/mentor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:'inventory'})});return r.json()});expect(result.message).not.toContain('while an assessment is active');
});
