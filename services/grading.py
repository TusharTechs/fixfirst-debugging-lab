"""Host-side comparison; remote development engine, separate from frozen Docker grading."""
import hashlib,json,os,secrets,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
BANK=json.loads((ROOT/'bank.json').read_text())
ENGINE='quickjs-ng-development-v1'

def execute(code,args):
    if not isinstance(code,str) or len(code)>24000: return {'status':'invalid-source'}
    packet=json.dumps({'code':code,'args':args,'binding':'__ff_'+secrets.token_hex(16)},allow_nan=False)
    if len(packet)>32768: return {'status':'oversize'}
    try:
        # Fresh interpreter + VM for every case, empty environment and no source
        # file written. The JS VM gets no host bindings or expected answers.
        p=subprocess.run([sys.executable,'-I',str(ROOT/'sandbox.py')],input=packet,
            text=True,capture_output=True,timeout=2,env={},cwd='/tmp')
        if p.returncode or len(p.stdout)>20000: return {'status':'execution-error'}
        return json.loads(p.stdout)
    except (subprocess.TimeoutExpired,ValueError,OSError): return {'status':'timeout-or-error'}

def equal(a,b):
    # JSON booleans must not compare equal to numbers in Python.
    if isinstance(a,bool) or isinstance(b,bool): return type(a)==type(b) and a==b
    if isinstance(a,(float,int)) and isinstance(b,(float,int)): return a==b
    if type(a)!=type(b): return False
    if isinstance(a,list): return len(a)==len(b) and all(equal(x,y) for x,y in zip(a,b))
    if isinstance(a,dict): return a.keys()==b.keys() and all(equal(a[k],b[k]) for k in a)
    return a==b

def matches(output,expected):
    return output.get('status')=='returned' and output.get('mutated') is False and equal(output.get('value'),expected)

def grade(packet):
    if not isinstance(packet,dict) or packet.get('kind')!='fixfirst-assessment': raise ValueError('Expected an assessment export')
    if packet.get('bankHash')!=BANK['bankHash'] or packet.get('version')!=BANK['version']: raise ValueError('Bank version mismatch')
    form=packet.get('session',{}).get('form')
    if form not in ('A','B') or not isinstance(packet.get('tasks'),list): raise ValueError('Invalid form or tasks')
    expected=[t for t in BANK['tasks'] if t['form']==form]
    rows={}
    for row in packet['tasks']:
        task_id=row.get('taskId')
        if task_id in rows or not any(t['id']==task_id for t in expected): raise ValueError('Foreign or duplicate task')
        if not isinstance(row.get('code',''),str) or len(row.get('code',''))>24000: raise ValueError('Source too large')
        rows[task_id]=row
    results=[]
    for task in expected:
        row=rows.get(task['id'])
        base={'taskId':task['id'],'form':form,'family':task['family'],'exploratory':task['exploratory'],'automaticMaximum':80,'humanReviewPending':True}
        if not row or row.get('attempted') is False:
            results.append(dict(base,allBehaviourPassed=False,automaticScore=0,missing=True));continue
        code=row['code']; details=[]
        for case in task['cases']:
            output=execute(code,case['args'])
            details.append({'case':'case-'+str(len(details)),'kind':case['kind'],'passed':matches(output,case['expected'])})
        custom=row.get('custom'); novel=False; valid=False
        if custom is not None:
            if not isinstance(custom,dict) or not isinstance(custom.get('args'),list) or 'expected' not in custom or len(json.dumps(custom))>4000: raise ValueError('Invalid regression case')
            novel=not any(equal(e['args'],custom['args']) for e in task['examples'])
            original=execute(task['baseline'],custom['args']);reference=execute(task['reference'],custom['args']);candidate=execute(code,custom['args'])
            # Only a genuine return/throw can expose a bug. Syntax errors,
            # timeouts, resource failures and unsettled promises are not evidence.
            valid=novel and original.get('status') in ('returned','threw','undefined') and matches(reference,custom['expected']) and not matches(original,custom['expected']) and matches(candidate,custom['expected'])
        target=[c for c in details if c['kind']=='target'];control=[c for c in details if c['kind']=='control']
        scores={'targetCases':50*sum(c['passed'] for c in target)/len(target),'controlCases':20*sum(c['passed'] for c in control)/len(control),'novelValidRegression':10 if valid else 0,'humanDiagnosis':None}
        results.append(dict(base,allBehaviourPassed=all(c['passed'] for c in details),automaticScore=round(sum(v for v in scores.values() if v is not None),2),scores=scores,cases=details,regression={'provided':custom is not None,'novel':novel,'valid':bool(valid)},sourceHash=hashlib.sha256(code.encode()).hexdigest()))
    return {'kind':'fixfirst-development-grade','engine':ENGINE,'version':BANK['version'],'bankHash':BANK['bankHash'],'notLearnerData':True,'session':packet.get('session'),'results':results,'humanReviewPending':True,'disclosure':'Development feedback only. Different JS runtime from the frozen Docker grader; do not pool into study outcome reports. No identity, unaided-work or human diagnosis verification.'}
