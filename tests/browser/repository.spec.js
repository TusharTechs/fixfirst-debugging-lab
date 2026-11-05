import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const repaired=await readFile(new URL('../../corpus/url-join-fragment/reference/lib/url-join.js',import.meta.url),'utf8');
test('real upstream module reproduces bug, accepts repair, and exports per-task provenance',async({page})=>{
 await page.goto('/?task=url-join-fragment');await expect(page.locator('#title')).toHaveText('The missing part of the URL');
 await page.locator('summary').click();await expect(page.locator('#provenance')).toContainText('José F. Romaniello');await expect(page.getByRole('link',{name:'MIT license'})).toHaveAttribute('href','/corpus/url-join-fragment/LICENSE');
 await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText('5/10 PASS');await expect(page.locator('#results')).toContainText('https://example.com/docs#section');
 await page.locator('#hypothesis').fill('Splitting at every hash loses later fragment segments. Only the first hash separates the path/query from the fragment.');
 await page.locator('#code').fill(repaired);await page.locator('#custom').fill('{"args":["https://example.com","guide","#intro#example"],"expected":"https://example.com/guide#intro#example"}');
 await page.locator('#run').click();await expect(page.locator('#test-count')).toHaveText('11/11 PASS');await expect(page.locator('#status')).toHaveText('Evidence captured');
 const pending=page.waitForEvent('download');await page.locator('#export').click();const download=await pending;const data=JSON.parse(await readFile(await download.path(),'utf8'));const task=data.tasks.find(t=>t.id==='url-join-fragment');expect(task.taskProvenance.baselineCommit).toBe('32815bf5d91a5e0add5c7c9ee3b74d2ae61885de');expect(task.runs.at(-1).regression).toMatchObject({original:'failed',repaired:'passed'});
});
test('native module syntax failure remains unverified and page fits mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?task=url-join-fragment');await page.locator('#code').fill('export default function {');await page.locator('#run').click();await expect(page.locator('.runner-error')).toBeVisible();await expect(page.locator('#status')).toHaveText('Unverified');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
