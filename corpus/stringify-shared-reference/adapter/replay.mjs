import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import fn from './index.js';
import {runScenario} from './scenarios.mjs';
const cases=JSON.parse(await readFile(new URL('./cases.json',import.meta.url),'utf8'));
for(const item of cases)test(item.name,async()=>{
 const args=structuredClone(item.args);
 const before=JSON.stringify(args);
 const actual=item.scenario?await runScenario(fn,{...item,args}):await fn(...args);
 assert.deepEqual(actual,item.expected);
 assert.equal(JSON.stringify(args),before,'Caller data was mutated');
});
