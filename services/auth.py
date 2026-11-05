"""Verify short-lived server-signed requests. This backend holds no signing secret."""
import base64,hashlib,json,re,threading,time
from pathlib import Path
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import ec,utils
KEY=serialization.load_pem_public_key((Path(__file__).parent/'service-public.pem').read_bytes())
SEEN={};LOCK=threading.Lock()

def authenticate(envelope,payload,api):
    if not isinstance(envelope,str) or len(envelope)>2048 or not isinstance(payload,str) or len(payload)>120000: raise ValueError('Invalid authorization')
    packet=json.loads(envelope)
    if not isinstance(packet,dict) or set(packet)!={'at','nonce','api','signature'}: raise ValueError('Invalid authorization')
    at=packet['at'];nonce=packet['nonce']
    now=int(time.time()*1000)
    if type(at)!=int or abs(now-at)>90000 or packet['api']!=api or not isinstance(nonce,str) or not re.fullmatch(r'[a-f0-9-]{36}',nonce): raise ValueError('Expired or invalid authorization')
    signature=base64.b64decode(packet['signature'],validate=True)
    if len(signature)!=64: raise ValueError('Invalid signature')
    encoded=utils.encode_dss_signature(int.from_bytes(signature[:32],'big'),int.from_bytes(signature[32:],'big'))
    message=str(at)+'\n'+nonce+'\n'+api+'\n'+hashlib.sha256(payload.encode()).hexdigest()
    KEY.verify(encoded,message.encode(),ec.ECDSA(hashes.SHA256()))
    with LOCK:
        for old,expiry in list(SEEN.items()):
            if expiry<now: del SEEN[old]
        if nonce in SEEN or len(SEEN)>=4096: raise ValueError('Replayed or busy request')
        SEEN[nonce]=at+90000
