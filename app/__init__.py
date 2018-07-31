import logging
import os
from logging.handlers import RotatingFileHandler

from flask import Flask, render_template
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from config import Config

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = "auth.login"
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

    if not application.debug and not application.testing:
        if not os.path.exists("logs"):
            os.mkdir("logs")

        file_handler = RotatingFileHandler(
            "logs/default.log", maxBytes=10240, backupCount=10
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s: %(message)s " "[in %(pathname)s:%(lineno)d]"
            )
        )
        file_handler.setLevel(logging.INFO)
        application.logger.addHandler(file_handler)

        application.logger.setLevel(logging.INFO)
        application.logger.info("Dex startup")

    return application


from app import models
