import io
import os
import tempfile
import unittest
from PIL import Image
from app import create_app,db
from app.models import User,Vehicle,EntryLog

class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        class Config:
            TESTING=True
            SECRET_KEY='test-only-not-a-production-key'
            SQLALCHEMY_DATABASE_URI='sqlite:///:memory:'
            SQLALCHEMY_TRACK_MODIFICATIONS=False
            RATE_LIMIT_DB=os.path.join(self.temp.name,'rate.sqlite3')
            MAX_CONTENT_LENGTH=16*1024*1024
            PLATE_DETECTOR=staticmethod(lambda image:'KL07AB1234')
        self.app=create_app(Config)
        self.context=self.app.app_context();self.context.push();db.create_all()
        for name,role in [('admin','admin'),('guard','security'),('student','student'),('other','student')]:
            u=User(username=name,role=role,name=name);u.set_password('Test-password-123');db.session.add(u)
        db.session.flush()
        self.student=User.query.filter_by(username='student').first().id
        self.other=User.query.filter_by(username='other').first().id
        db.session.add_all([Vehicle(plate_number='KL-07-AB-1234',owner_id=self.student,owner_name='Student',type='Student',is_inside=False),Vehicle(plate_number='KL07CD5678',owner_id=self.other,owner_name='Other',type='Student',is_inside=False)])
        db.session.commit()
        self.client=self.app.test_client()
    def tearDown(self):
        db.session.remove();db.drop_all();self.context.pop();self.temp.cleanup()
    def post(self,path,data=None,client=None,**kwargs):
        c=client or self.client
        token=c.get('/api/auth/csrf').json['csrfToken']
        return c.post(path,json=data,headers={'X-CSRF-Token':token},**kwargs)
    def login(self,name='admin',client=None):
        return self.post('/api/auth/login',{'username':name,'password':'Test-password-123'},client=client)
    def test_all_private_routes_require_authentication(self):
        for path in ['/api/vehicles/','/api/gate/logs','/api/parking/zones','/api/stats/','/api/auth/me']:
            self.assertEqual(self.client.get(path).status_code,401,path)
        for path in ['/api/gate/entry','/api/gate/exit','/api/anpr/','/api/gate/scan','/api/auth/register','/api/vehicles/']:
            self.assertEqual(self.post(path,{}).status_code,401,path)
    def test_proxy_normalized_routes_do_not_redirect(self):
        for path in ['/api/vehicles', '/api/vehicles/', '/api/anpr', '/api/anpr/']:
            response = self.client.get(path) if 'vehicles' in path else self.post(path, {})
            self.assertEqual(response.status_code, 401, path)
            self.assertNotIn('Location', response.headers)
        self.login()
        for path in ['/api/vehicles', '/api/vehicles/']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            self.assertEqual(len(response.json), 2)
            self.assertNotIn('Location', response.headers)
        response = self.post('/api/vehicles', {'plate': 'KL07EF9012', 'owner': 'Visitor', 'type': 'Visitor'})
        self.assertEqual(response.status_code, 201)
        self.assertNotIn('Location', response.headers)
        buf = io.BytesIO()
        Image.new('RGB', (12, 12)).save(buf, format='PNG')
        response = self.upload(buf.getvalue(), path='/api/anpr')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('Location', response.headers)
    def test_csrf_enforced_even_for_login(self):
        self.assertEqual(self.client.post('/api/auth/login',json={}).status_code,403)
        self.login()
        self.assertEqual(self.client.post('/api/gate/entry',json={'plate':'KL07AB1234'}).status_code,403)
    def test_student_cannot_create_admin_or_modify_registry_or_gate(self):
        self.login('student')
        for path in ['/api/auth/register','/api/vehicles/','/api/gate/entry','/api/gate/exit','/api/anpr/','/api/gate/scan']:
            self.assertEqual(self.post(path,{'role':'admin'}).status_code,403,path)
    def test_student_idor_and_query_roles(self):
        self.login('student')
        vehicles=self.client.get('/api/vehicles/').json
        self.assertEqual(len(vehicles),1);self.assertEqual(vehicles[0]['ownerId'],self.student)
        forbidden=Vehicle.query.filter_by(owner_id=self.other).first()
        self.assertEqual(self.client.get('/api/gate/logs?vehicle_id='+str(forbidden.id)).status_code,404)
        stats=self.client.get('/api/stats/?role=admin&user_id='+str(self.other)).json
        self.assertEqual(stats[0]['title'],'Total Visits')
    def test_script_and_sql_login_payloads(self):
        for value in ['<script>alert(1)</script>',"admin' OR 1=1 --"]:
            self.assertIn(self.post('/api/auth/login',{'username':value,'password':'anything'}).status_code,[400,401])
        self.assertEqual(User.query.count(),4)
    def test_forged_cookie_denied(self):
        self.client.set_cookie('session','forged-admin-cookie')
        self.assertEqual(self.client.get('/api/vehicles/').status_code,401)
    def test_login_rate_limit(self):
        codes=[self.post('/api/auth/login',{'username':'missing','password':'wrong'}).status_code for _ in range(11)]
        self.assertEqual(codes[-1],429)
    def test_logout_invalidates_browser_session(self):
        self.login();self.assertEqual(self.client.get('/api/auth/me').status_code,200)
        self.post('/api/auth/logout',{})
        self.assertEqual(self.client.get('/api/auth/me').status_code,401)
    def test_no_wildcard_cors_and_security_headers(self):
        response=self.client.get('/api/auth/csrf',headers={'Origin':'https://evil.example'})
        self.assertIsNone(response.headers.get('Access-Control-Allow-Origin'))
        self.assertEqual(response.headers['X-Content-Type-Options'],'nosniff')
        self.assertIn('HttpOnly',response.headers.get('Set-Cookie',''))
    def test_registration_validation(self):
        self.login()
        self.assertEqual(self.post('/api/auth/register',{'username':'new','password':'short','role':'admin','name':'new'}).status_code,400)
        self.assertEqual(self.post('/api/auth/register',{'username':'new','password':'long-password-123','role':'root','name':'new'}).status_code,400)
    def test_replayed_gate_action_does_not_duplicate(self):
        self.login('guard')
        self.assertEqual(self.post('/api/gate/entry',{'plate':'kl07ab1234'}).status_code,200)
        self.assertEqual(self.post('/api/gate/entry',{'plate':'KL-07-AB-1234'}).status_code,409)
        self.assertEqual(EntryLog.query.count(),1)
        self.assertEqual(self.post('/api/gate/exit',{'plate':'KL07AB1234'}).status_code,200)
        self.assertEqual(self.post('/api/gate/exit',{'plate':'KL07AB1234'}).status_code,409)
    def test_inactive_vehicle_denied(self):
        self.login('guard');Vehicle.query.first().status='inactive';db.session.commit()
        self.assertEqual(self.post('/api/gate/entry',{'plate':'KL07AB1234'}).status_code,403)
    def test_bad_inputs_and_negative_limits(self):
        self.login()
        for data in [[],None,{'plate':-1},{'plate':'<script>'}]:
            self.assertEqual(self.post('/api/gate/entry',data).status_code,400)
        for limit in ['-1','0','1001','garbage']:
            self.assertEqual(self.client.get('/api/gate/logs?limit='+limit).status_code,400)
        result=self.post('/api/vehicles/',{'plate':'KL07AB1234','owner':'x','type':'Student'})
        self.assertEqual(result.status_code,409)
    def upload(self,raw,name='photo.png',mime='image/png',path='/api/anpr/'):
        token=self.client.get('/api/auth/csrf').json['csrfToken']
        return self.client.post(path,data={'image':(io.BytesIO(raw),name,mime)},headers={'X-CSRF-Token':token})
    def test_fake_image_and_svg_rejected_both_routes(self):
        self.login('guard')
        for path in ['/api/anpr/','/api/gate/scan']:
            self.assertEqual(self.upload(b'<script>evil</script>',path=path).status_code,400)
            self.assertEqual(self.upload(b'<svg/>','photo.svg','image/svg+xml',path).status_code,400)
    def test_valid_image_and_recognition_limit(self):
        self.login('guard');buf=io.BytesIO();Image.new('RGB',(12,12)).save(buf,format='PNG')
        for _ in range(10):
            self.assertEqual(self.upload(buf.getvalue()).status_code,200)
        self.assertEqual(self.upload(buf.getvalue()).status_code,429)

if __name__=='__main__':
    unittest.main()
