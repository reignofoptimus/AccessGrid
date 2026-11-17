import os
import secrets
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

basedir=Path(__file__).resolve().parent
load_dotenv(basedir/'.env')
production=os.environ.get('ACCESSGRID_PRODUCTION')=='1'
database_url=os.environ.get('DATABASE_URL','')
if database_url.startswith('postgres://'):
    database_url='postgresql://'+database_url[len('postgres://'):]
if production and not database_url:
    raise RuntimeError('Production requires DATABASE_URL for persistent storage')

class Config:
    SECRET_KEY=os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    SQLALCHEMY_DATABASE_URI=database_url or 'sqlite:///'+str(basedir/'accessgrid.db')
    SQLALCHEMY_TRACK_MODIFICATIONS=False
    SQLALCHEMY_ENGINE_OPTIONS={'pool_pre_ping':True,'pool_recycle':300}
    MAX_CONTENT_LENGTH=9*1024*1024
    MAX_FORM_MEMORY_SIZE=512*1024
    MAX_FORM_PARTS=10
    SESSION_COOKIE_HTTPONLY=True
    SESSION_COOKIE_SAMESITE=os.environ.get('SESSION_COOKIE_SAMESITE','Lax')
    SESSION_COOKIE_SECURE=production
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8)
    SESSION_REFRESH_EACH_REQUEST=False
