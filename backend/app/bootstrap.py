import os
import re
from app import db
from app.models import User,ParkingZone

def provision():
    username=os.environ.get('BOOTSTRAP_ADMIN_USERNAME','').strip()
    password=os.environ.get('BOOTSTRAP_ADMIN_PASSWORD','')
    if not User.query.filter_by(role='admin').first() and not (username and password):
        raise RuntimeError('First deployment requires BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD')
    existing=User.query.filter_by(username=username).first() if username else None
    if existing is not None and existing.role!='admin':
        raise RuntimeError('Bootstrap username belongs to a non-administrator')
    if username and existing is None:
        if not re.fullmatch(r'[A-Za-z0-9_.-]{3,64}',username) or not 12<=len(password)<=128:
            raise RuntimeError('Invalid bootstrap credentials: username 3–64 characters, password 12–128 characters')
        account=User(username=username,role='admin',name='Campus Administrator',department='Administration')
        account.set_password(password)
        db.session.add(account)
    for ident,label,capacity in [('A','Staff Parking',50),('B','Faculty Parking',30),('C','Student Parking',100),('D','Visitor Parking',20)]:
        if db.session.get(ParkingZone,ident) is None:
            db.session.add(ParkingZone(id=ident,name='Zone '+ident,label=label,capacity=capacity,occupied_count=0,is_restricted=ident=='D',color='#b7d6a0'))
    db.session.commit()
