import base64,hashlib,json,secrets,time
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec,utils
import auth
private=ec.generate_private_key(ec.SECP256R1());auth.KEY=private.public_key()
payload='{"task":"technical-fixture"}'
def signed(api='plan',text=payload,at=None):
    at=at or int(time.time()*1000);nonce=secrets.token_hex(18)
    msg=str(at)+'\n'+nonce+'\n'+api+'\n'+hashlib.sha256(text.encode()).hexdigest()
    r,s=utils.decode_dss_signature(private.sign(msg.encode(),ec.ECDSA(hashes.SHA256())))
    return json.dumps({'at':at,'nonce':nonce,'api':api,'signature':base64.b64encode(r.to_bytes(32,'big')+s.to_bytes(32,'big')).decode()})
valid=signed();auth.authenticate(valid,payload,'plan')
for token,text,api in [(valid,payload,'plan'),(signed(),payload+'x','plan'),(signed(),payload,'grade'),(signed(at=int(time.time()*1000)-100000),payload,'plan'),('{}',payload,'plan')]:
    try:auth.authenticate(token,text,api);raise AssertionError('Invalid authorization accepted')
    except (ValueError,KeyError,TypeError):pass
    except Exception as e:assert e.__class__.__name__=='InvalidSignature',type(e)
print('{"signatureChecks":6,"passed":true}')
