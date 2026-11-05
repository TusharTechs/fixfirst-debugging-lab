import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tasks} from '../public/tasks.js';
for(const task of tasks.filter(task=>!task.format)){test(task.id+' has a reproducible failing baseline',()=>{const fn=new Function(task.code+';return '+task.entry)();const safe=task.tests.filter(t=>!t.throws);assert.ok(safe.some(t=>{try{return JSON.stringify(fn(...t.args))!==JSON.stringify(t.expected)}catch{return true}}));});}
