import os,secrets,subprocess,time,urllib.request,urllib.error,json,base64
from pathlib import Path
root=str(Path(__file__).resolve().parents[1]);port=3100;base=f'http://127.0.0.1:{port}'
password=secrets.token_urlsafe(32)
database='/tmp/family-http-'+secrets.token_hex(8)+'.sqlite'
def start(auth):
 e=os.environ.copy();e.pop('FAMILY_PASSWORD',None);e.update(DATABASE_PATH=database,NEXT_TELEMETRY_DISABLED='1')
 if auth:e['FAMILY_PASSWORD']=password
 return subprocess.Popen(['node','node_modules/next/dist/bin/next','start','-p',str(port),'--hostname','127.0.0.1'],cwd=root,env=e,stdout=open('/tmp/family-http.log','w'),stderr=subprocess.STDOUT)
def request(path='/',auth=False,body=None,origin=None):
 h={}
 if auth:h['Authorization']='Basic '+base64.b64encode(('family:'+password).encode()).decode()
 if origin:h['Origin']=origin
 if body:h['Content-Type']='application/json'
 req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body else None,headers=h)
 try:
  with urllib.request.urlopen(req) as r:return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
def wait():
 for _ in range(100):
  try:request();return
  except urllib.error.URLError:time.sleep(.1)
 raise RuntimeError('Server did not start')
p=start(False)
try:wait();assert request()[0]==503;assert request('/api/finance')[0]==503;print('PASS: production blocks page and API without configured password')
finally:p.terminate();p.wait()
p=start(True)
try:
 wait();assert request()[0]==401;assert request('/api/finance')[0]==401;assert request(auth=True)[0]==200
 code,data=request('/api/finance',True);rows=json.loads(data);assert code==200 and next(r for r in rows if r['id']=='opening')['amount']==7200000
 r={'id':'http-'+secrets.token_hex(5),'kind':'transaction','name':'Smoke groceries','amount':12345,'date':'2026-10-15','type':'expense','method':'Cash','category':'Groceries and food'}
 assert request('/api/finance',True,{'record':r,'action':'create'},'https://evil.invalid')[0]==403
 assert request('/api/finance',True,{'record':r,'action':'create'},base)[0]==200
 assert request('/api/finance',True,{'record':r,'action':'create'},base)[0]==400
 assert any(x['id']==r['id'] for x in json.loads(request('/api/finance',True)[1]))
 assert b'Smoke groceries' in request('/api/finance?csv=1',True)[1]
 print('PASS: authenticated page and ledger, origin protection, write persistence, duplicate rejection, CSV export')
 p.terminate();p.wait();p=start(True);wait();assert any(x['id']==r['id'] for x in json.loads(request('/api/finance',True)[1]));print('PASS: SQLite ledger survives production server restart')
finally:p.terminate();p.wait()
