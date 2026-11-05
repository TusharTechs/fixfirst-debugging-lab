// Explicit opt-in Docker checks; never execute the candidate on the host.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {replay} from './replay-repository.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
await mkdir(path.join(project,'.runner-work'),{recursive:true});
const temp=await mkdtemp(path.join(project,'.runner-work','verify-'));
const candidate=path.join(temp,'candidate.js');
const probe=`
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {networkInterfaces} from 'node:os';
assert.equal(process.getuid(),65534);
assert.throws(()=>writeFileSync('/task/write-probe.txt','blocked'),{code:'EROFS'});
assert.throws(()=>writeFileSync('/root-write-probe.txt','blocked'),{code:'EROFS'});
assert.equal(process.env.FIXFIRST_RUNNER_SENTINEL,undefined);
assert.ok(Object.keys(networkInterfaces()).every(name=>name==='lo'));
assert.match(readFileSync('/proc/self/status','utf8'),/CapEff:\\s+0+\\n/);
assert.match(readFileSync('/proc/self/status','utf8'),/NoNewPrivs:\\s+1/);
await assert.rejects(fetch('https://1.1.1.1',{signal:AbortSignal.timeout(800)}));
console.log('ISOLATION_PROBE_PASS: uid, read-only root and task, environment, network, capabilities, no-new-privileges');
`;
const report={at:new Date().toISOString(),checks:[]};
try {
 const reference=await readFile(path.join(project,'corpus/url-join-fragment/reference/lib/url-join.js'),'utf8');
 await writeFile(candidate,probe+reference);
 process.env.FIXFIRST_RUNNER_SENTINEL='dummy-not-a-secret';
 const isolation=await replay({candidatePath:candidate});
 delete process.env.FIXFIRST_RUNNER_SENTINEL;
 assert.ok(isolation.repaired);assert.match(isolation.runs[1].output,/ISOLATION_PROBE_PASS/);
 report.checks.push({name:'Isolation controls',passed:true,execution:isolation});
 await writeFile(candidate,'while (true) {}\nexport default function urlJoin() {}\n');
 const timeout=await replay({candidatePath:candidate});
 assert.equal(timeout.runs[1].reason,'deadline');assert.equal(timeout.repaired,false);
 report.checks.push({name:'Infinite loop deadline',passed:true,execution:timeout});
 const args=process.argv.slice(2),index=args.indexOf('--out');
 if(index>=0)await writeFile(args[index+1],JSON.stringify(report,null,2)+'\n');
 console.log('2 Docker integration checks passed: isolation controls and infinite-loop deadline.');
} finally {delete process.env.FIXFIRST_RUNNER_SENTINEL;await rm(temp,{recursive:true,force:true});}
