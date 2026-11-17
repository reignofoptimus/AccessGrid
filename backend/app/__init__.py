from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from config import Config


db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'auth.login'

def create_app(config_class=Config):
    app = Flask(__name__)
    # Reverse proxies can normalize trailing slashes. Serve both forms directly,
    # including POSTs, rather than redirecting cookies or uploads across origins.
    app.url_map.strict_slashes = False
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    # Same-origin API by default. Separate frontends require an explicit allowlist.
    import os
    origins = [v.strip() for v in os.environ.get('CORS_ORIGINS','').split(',') if v.strip()]
    if '*' in origins:
        raise RuntimeError('CORS_ORIGINS must list explicit origins')
    if origins:
        CORS(app, supports_credentials=True, resources={r"/api/*":{"origins":origins}})
    if os.environ.get('ACCESSGRID_PRODUCTION') == '1':
        key = os.environ.get('SECRET_KEY','')
        if len(key) < 32 or key == 'you-will-never-guess':
            raise RuntimeError('Production requires a strong SECRET_KEY of at least 32 characters')
    from app.security import protect_api
    app.before_request(protect_api)
    from werkzeug.exceptions import HTTPException
    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code
    @app.errorhandler(Exception)
    def internal_error(error):
        db.session.rollback()
        app.logger.exception('Request failed')
        return jsonify(error='Request could not be completed'), 500
    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['X-Frame-Options']='DENY'
        response.headers['Referrer-Policy']='same-origin'
        response.headers['Cache-Control']='no-store'
        if app.config['SESSION_COOKIE_SECURE']:
            response.headers['Strict-Transport-Security']='max-age=31536000'
        return response
    login.init_app(app)

    # Import and register blueprints
    from app.routes.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.routes.vehicles import bp as vehicles_bp
    app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')

    from app.routes.gate import bp as gate_bp
    app.register_blueprint(gate_bp, url_prefix='/api/gate')

    from app.routes.parking import bp as parking_bp
    app.register_blueprint(parking_bp, url_prefix='/api/parking')

    from app.routes.stats import bp as stats_bp
    app.register_blueprint(stats_bp, url_prefix='/api/stats')

    from app.routes.anpr_routes import anpr_bp
    app.register_blueprint(anpr_bp, url_prefix='/api/anpr')

    from app.health import bp as health_bp
    app.register_blueprint(health_bp)

    from app.commands import register_commands
    register_commands(app)
    return app

from app import models

@login.user_loader
def load_user(id):
    return models.User.query.get(int(id))

