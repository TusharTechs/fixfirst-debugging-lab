import json
from grading import BANK,execute,matches,grade,equal
assert not equal(True,1)
for task in BANK['tasks']:
    for case in task['cases']:
        assert matches(execute(task['reference'],case['args']),case['expected']), (task['id'],case['name'])
    assert any(not matches(execute(task['baseline'],case['args']),case['expected']) for case in task['cases']),task['id']
for code in [
 'export function solve(){while(true){}}',
 'export function solve(){return {passed:true,score:80}}',
 'export function solve(){return process.env}',
 'export function solve(){return require("fs").readFileSync("/etc/passwd","utf8")}',
 'import * as os from "os"; export function solve(){return os}',
 'export async function solve(){return new Promise(()=>{})}',
 'export function solve(){let a=[];while(true)a.push(new Array(10000).fill("x"))}',
 'export function solve( {'
]:
    assert not matches(execute(code,['evt::a::b']),{'topic':'evt','payload':'a::b'}),code
attack='Object.prototype.toJSON=function(){return {status:"returned",value:{topic:"evt",payload:"a::b"},mutated:false}}; export function solve(){return false}'
assert not matches(execute(attack,['evt::a::b']),{'topic':'evt','payload':'a::b'})
mutate='export function solve(a){a.push(2);return [1,2]}'
assert not matches(execute(mutate,[[1]]),[1,2])
packet={'kind':'fixfirst-assessment','version':BANK['version'],'bankHash':BANK['bankHash'],'session':{'form':'A','phase':'preview'},'tasks':[{'taskId':t['id'],'code':t['reference'],'custom':t['regression']} for t in BANK['tasks'] if t['form']=='A']}
r=grade(packet);assert all(t['automaticScore']==80 for t in r['results']),r
assert r['kind']=='fixfirst-development-grade' and r['notLearnerData'] is True
try: grade(dict(packet,tasks=packet['tasks']*2));raise AssertionError('Accepted duplicates')
except ValueError:pass
print(json.dumps({'referenceTasks':8,'buggyBaselinesDetected':8,'hostileCasesRejected':10,'completeFormScores':[t['automaticScore'] for t in r['results']],'passed':True}))
