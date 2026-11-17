"""Nonpublic, idempotent release initialization; no destructive demo seeding."""
from flask_migrate import upgrade
from sqlalchemy import text
from app import create_app,db
from app.bootstrap import provision

def initialize(app):
    with app.app_context():
        # Serialize migrations when an old/new Render instance overlaps deployment.
        lock=db.engine.connect() if db.engine.dialect.name=='postgresql' else None
        try:
            if lock is not None:
                lock.execute(text('SELECT pg_advisory_lock(734120991)'))
            upgrade(directory='migrations')
            provision()
        finally:
            if lock is not None:
                lock.execute(text('SELECT pg_advisory_unlock(734120991)'))
                lock.close()

if __name__=='__main__':
    initialize(create_app())
