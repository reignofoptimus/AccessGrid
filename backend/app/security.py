from contextlib import closing
import hashlib
import hmac
import os
import secrets
import sqlite3
import time
from flask import current_app, request, session, abort
from flask_login import current_user


def csrf_token():
    if 'csrf' not in session:
        session['csrf'] = secrets.token_urlsafe(32)
    return session['csrf']


def throttle(key, maximum, seconds):
    # Shared across local workers/restarts, with atomic increments; never trust X-Forwarded-For.
    path = current_app.config['RATE_LIMIT_DB']
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    now = int(time.time())
    key = hashlib.sha256(key.encode()).hexdigest()
    with closing(sqlite3.connect(path, timeout=5)) as conn, conn:
        conn.execute('CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER, expires INTEGER)')
        conn.execute('BEGIN IMMEDIATE')
        conn.execute('DELETE FROM limits WHERE expires <= ?', (now,))
        row = conn.execute('SELECT count FROM limits WHERE key=?', (key,)).fetchone()
        if row and row[0] >= maximum:
            abort(429, description='Too many requests. Try again later.')
        conn.execute('INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1', (key, now+seconds))


def protect_api():
    if not request.path.startswith('/api/') or request.method == 'OPTIONS':
        return
    if request.endpoint is None:
        abort(404)
    if request.endpoint not in {'auth.csrf', 'auth.login'}:
        if not current_user.is_authenticated:
            abort(401)
        if current_user.role not in {'admin','security','student'}:
            abort(403)
        if request.blueprint in {'anpr', 'gate'} and request.endpoint != 'gate.get_logs' and current_user.role not in {'admin','security'}:
            abort(403)
        if request.endpoint in {'auth.register','vehicles.add_vehicle'} and current_user.role != 'admin':
            abort(403)
    if request.method not in {'GET','HEAD','OPTIONS'}:
        token = request.headers.get('X-CSRF-Token','')
        expected = session.get('csrf','')
        if not expected or not hmac.compare_digest(token, expected):
            abort(403, description='Invalid CSRF token')
    ip = request.remote_addr or 'unknown'
    throttle('api:'+ip, 300, 60)
    if request.endpoint == 'auth.login':
        throttle('login:'+ip, 10, 900)
        data = request.get_json(silent=True)
        if isinstance(data,dict) and isinstance(data.get('username'),str):
            throttle('account:'+data['username'].strip().lower()[:64], 20, 900)
    if request.endpoint in {'anpr.detect_plate_api','gate.scan_vehicle'}:
        throttle('recognition:'+str(current_user.id), 10, 60)


def json_object():
    data=request.get_json(silent=True)
    if not isinstance(data,dict):
        abort(400, description='Expected a JSON object')
    return data


def text(data,key,maximum,required=True):
    value=data.get(key,'')
    if not isinstance(value,str) or len(value)>maximum or (required and not value.strip()) or any(ord(c)<32 or c in '<>' for c in value):
        abort(400, description='Invalid '+key)
    return value.strip()


def plate_value(data):
    import re
    value=text(data,'plate',20).upper()
    value=re.sub(r'[ -]','',value)
    if not re.fullmatch(r'[A-Z0-9]{6,15}',value):
        abort(400, description='Invalid plate')
    return value


def find_vehicle(plate):
    from app.models import Vehicle
    from sqlalchemy import func
    return Vehicle.query.filter(func.replace(func.replace(Vehicle.plate_number,'-',''),' ','')==plate).first()
