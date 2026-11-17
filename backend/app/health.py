from flask import Blueprint,jsonify,current_app
from sqlalchemy import text
from app import db

bp=Blueprint('health',__name__)

@bp.get('/healthz')
def health():
    try:
        db.session.execute(text('SELECT 1'))
    except Exception:
        db.session.rollback()
        return jsonify(status='unavailable'),503
    return jsonify(status='ok')

@bp.get('/readyz')
def ready():
    # Cached initialization; no repeated OCR or prediction on health polls.
    from app.anpr.detector import get_session,RecognitionUnavailable
    try:
        get_session()
    except RecognitionUnavailable:
        return jsonify(status='unavailable'),503
    return health()
