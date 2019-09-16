from flask import Flask, render_template
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, mixins
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from config import Config


class Anonymous(mixins.AnonymousUserMixin):
    def __init__(self):
        self.username = "Guest"


db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = "auth.login"
login.anonymous_user = Anonymous
mail = Mail()
bcrypt = Bcrypt()


def not_found_error(error):
    return render_template("errors/404.html"), 404


def internal_error(error):
    db.session.rollback()
    return render_template("errors/500.html"), 500


def permission_denied(error):
    db.session.rollback()
    return render_template("errors/403.html"), 403


def create_app(config_class=Config):
    application = Flask(__name__)
    application.config.from_object(config_class)

    db.init_app(application)
    migrate.init_app(application, db)
    login.init_app(application)
    mail.init_app(application)

    application.register_error_handler(403, permission_denied)
    application.register_error_handler(405, permission_denied)
    application.register_error_handler(404, not_found_error)
    application.register_error_handler(500, internal_error)

    from app.auth import bp as auth_bp

    application.register_blueprint(auth_bp)

    from app.main import bp as main_bp

    application.register_blueprint(main_bp)

    from app.api import bp as api_bp

    application.register_blueprint(api_bp, url_prefix="/api")

    from app.admin import bp as admin_bp

    application.register_blueprint(admin_bp, url_prefix="/admin")

    return application


from app import models
