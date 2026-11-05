import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {repositoryTask} from '../public/repository-task.js';
const root=new URL('../corpus/url-join-fragment/',import.meta.url);
test('curated repository files match pinned hashes and distributed notices',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 for(const [name,hash] of Object.entries(manifest.sha256))assert.equal(createHash('sha256').update(await readFile(new URL(name,root))).digest('hex'),hash,name);
 assert.equal(repositoryTask.code,await readFile(new URL('baseline/lib/url-join.js',root),'utf8'));
 assert.equal(await readFile(new URL('../public/corpus/url-join-fragment/source.js',import.meta.url),'utf8'),repositoryTask.code);
 assert.equal(await readFile(new URL('../public/corpus/url-join-fragment/LICENSE',import.meta.url),'utf8'),await readFile(new URL('baseline/LICENSE',root),'utf8'));
 assert.equal(repositoryTask.format,'esm-default');assert.equal(repositoryTask.provenance.baselineCommit,manifest.baselineCommit);
});

import {additionalTasks} from '../public/additional-tasks.js';
for(const task of additionalTasks)test(task.id+' preserves source, notices, manifest and replay inputs',async()=>{
 const root=new URL('../corpus/'+task.id+'/',import.meta.url);
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 for(const [name,hash] of Object.entries(manifest.sha256))assert.equal(createHash('sha256').update(await readFile(new URL(name,root))).digest('hex'),hash,name);
 assert.equal(task.code,await readFile(new URL('baseline/'+manifest.sourcePath,root),'utf8'));
 assert.equal(task.code,await readFile(new URL('../public/corpus/'+task.id+'/source.js',import.meta.url),'utf8'));
 assert.equal(await readFile(new URL('../public/corpus/'+task.id+'/LICENSE',import.meta.url),'utf8'),await readFile(new URL(manifest.licensePath,root),'utf8'));
 assert.deepEqual(JSON.parse(await readFile(new URL('../public/corpus/'+task.id+'/manifest.json',import.meta.url),'utf8')),manifest);
 assert.deepEqual(task.provenance,manifest);
});
