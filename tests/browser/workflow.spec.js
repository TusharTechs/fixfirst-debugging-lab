import {test,expect} from '@playwright/test';
test('failing baseline, real fix, independent regression, transfer and stale edit',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Run tests'}).click();await expect(page.locator('#test-count')).toHaveText('1/3 PASS');
 await page.locator('#hypothesis').fill('The truthiness filter drops zero and retains strings. Check numeric type and finiteness.');
 await page.locator('#code').fill('function exportInvoices(invoices) { return invoices.filter(i => Number.isFinite(i.balance)); }');
 await page.locator('#custom').fill('{"args":[[{"id":"z","balance":0},{"id":"x","balance":"2"}]],"expected":[{"id":"z","balance":0}]}');
 await page.getByRole('button',{name:'Run tests'}).click();await expect(page.locator('#test-count')).toHaveText('4/4 PASS');await expect(page.locator('#status')).toHaveText('Evidence captured');
 await page.locator('#code').fill('function exportInvoices() {return [];}');await expect(page.locator('#status')).toHaveText('Unverified');
 await page.getByRole('button',{name:'02 An empty shelf'}).click();await expect(page.locator('#hint')).toBeDisabled();
});
test('syntax failure, custom input validation, timeout and persistence',async({page})=>{
 await page.goto('/');await page.locator('#code').fill('function {');await page.locator('#run').click();await expect(page.locator('.runner-error')).toBeVisible();
 await page.locator('#code').fill('function exportInvoices(){while(true){}}');await page.locator('#run').click();await expect(page.locator('.runner-error')).toContainText('timed out',{timeout:6000});
 await page.locator('#custom').fill('wrong');await page.locator('#run').click();await expect(page.locator('.runner-error')).toContainText('must be JSON');
 await page.reload();await expect(page.locator('#custom')).toHaveValue('wrong');
});
test('sandbox blocks network access and exports honest report',async({page})=>{
 await page.goto('/');await page.locator('#code').fill('function exportInvoices(){ fetch("https://example.com").catch(()=>{}); return []; }');
 const requests=[];page.on('request',r=>{if(r.url().startsWith('https://example.com'))requests.push(r.url())});await page.locator('#run').click();await expect(page.locator('#test-count')).toContainText('PASS');expect(requests).toEqual([]);
 const dl=page.waitForEvent('download');await page.locator('#export').click();expect((await dl).suggestedFilename()).toBe('fixfirst-work-sample.json');
});
