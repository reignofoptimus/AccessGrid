"""Run inside the Linux container after startup. Uses only synthetic images."""
import http.cookiejar
import io
import json
import os
import urllib.request
import uuid
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from app.anpr.detector import ocr_plate

base='http://127.0.0.1:'+os.environ.get('PORT','10000')
cookies=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))

def request(path,data=None,headers=None):
    headers=dict(headers or {})
    # This loopback-only smoke server uses HTTP; production cookies are Secure.
    # Send the captured cookie explicitly here without changing the application's cookie policy.
    if list(cookies):headers['Cookie']='; '.join(cookie.name+'='+cookie.value for cookie in cookies)
    with client.open(urllib.request.Request(base+path,data=data,headers=headers),timeout=90) as response:
        return json.load(response)

assert request('/readyz')['status']=='ok'
token=request('/api/auth/csrf')['csrfToken']
request('/api/auth/login',json.dumps({'username':os.environ['BOOTSTRAP_ADMIN_USERNAME'],'password':os.environ['BOOTSTRAP_ADMIN_PASSWORD']}).encode(),{'Content-Type':'application/json','X-CSRF-Token':token})
assert request('/api/auth/me')['role']=='admin'
assert isinstance(request('/api/vehicles'),list)
assert len(request('/api/parking/zones'))==4

# Exercise the real trained detector via authenticated HTTP, including large-image downsampling.
for size in [(640,360),(3000,2000)]:
    buffer=io.BytesIO();Image.new('RGB',size,'white').save(buffer,format='JPEG')
    boundary=uuid.uuid4().hex
    payload=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="blank.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode()+buffer.getvalue()+f'\r\n--{boundary}--\r\n'.encode()
    token=request('/api/auth/csrf')['csrfToken']
    assert request('/api/anpr',payload,{'Content-Type':'multipart/form-data; boundary='+boundary,'X-CSRF-Token':token})['plate'] is None

# Exercise the actual Tesseract executable, not a mock.
image=Image.new('RGB',(720,110),'white')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',52)
ImageDraw.Draw(image).text((20,20),'KL07AB1234',font=font,fill='black')
recognized=ocr_plate(np.asarray(image))
assert recognized=='KL07AB1234', f'Synthetic OCR mismatch: {recognized!r}'
print('PASS: readiness, PostgreSQL-backed login, zones, ONNX HTTP inference and real Tesseract OCR')
