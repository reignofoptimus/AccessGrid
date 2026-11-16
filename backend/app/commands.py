import click
from flask import current_app
from app import db
from app.models import User

def register_commands(app):
    @app.cli.command('create-user')
    @click.option('--username',prompt=True)
    @click.option('--role',type=click.Choice(['admin','security','student']),prompt=True)
    @click.option('--name',prompt=True)
    @click.password_option()
    def create_user(username,role,name,password):
        """Provision a campus account locally; never a public setup endpoint."""
        import re
        if not re.fullmatch(r'[A-Za-z0-9_.-]{3,64}',username) or not name.strip() or len(name)>64 or len(password)<12 or len(password)>128:
            raise click.ClickException('Invalid account fields; password must contain 12–128 characters.')
        if User.query.filter_by(username=username).first():
            raise click.ClickException('Username already exists.')
        user=User(username=username,role=role,name=name.strip())
        user.set_password(password)
        db.session.add(user);db.session.commit()
        click.echo('Account created.')
