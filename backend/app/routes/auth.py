import re
import os
from flask import Blueprint, jsonify, session, abort
from flask_login import login_user, logout_user, current_user
from app import db
from app.models import User
from app.security import csrf_token, json_object, text

bp=Blueprint('auth',__name__)

@bp.get('/csrf')
def csrf():
    return jsonify(csrfToken=csrf_token())

@bp.post('/login')
def login():
    data=json_object()
    username=text(data,'username',64)
    password=text(data,'password',128)
    user=User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password) or (os.environ.get('ACCESSGRID_PRODUCTION') == '1' and len(password)<12):
        abort(401,description='Invalid username or password')
    session.clear()
    login_user(user)
    session.permanent=True
    csrf_token()
    return jsonify(user.to_dict())

@bp.get('/me')
def me():
    return jsonify(current_user.to_dict())

@bp.post('/logout')
def logout():
    logout_user()
    session.clear()
    return jsonify(message='Signed out')

@bp.post('/register')
def register():
    data=json_object()
    username=text(data,'username',64)
    if not re.fullmatch(r'[A-Za-z0-9_.-]{3,64}',username):
        abort(400,description='Invalid username')
    password=text(data,'password',128)
    if len(password)<12:
        abort(400,description='Use a password of at least 12 characters')
    role=data.get('role','student')
    if role not in {'admin','security','student'}:
        abort(400,description='Invalid role')
    if User.query.filter_by(username=username).first():
        abort(409,description='Username already exists')
    user=User(username=username,role=role,name=text(data,'name',64),department=text(data,'department',64,False),student_id=text(data,'studentId',20,False))
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()),201
