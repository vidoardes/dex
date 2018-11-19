import logging
import os

from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or 25)
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS") is not None
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_FROM = os.environ.get("MAIL_FROM")
    LANGUAGES = ["en", "es"]
    TIMEZONE = "Europe/Paris"

    # Number of times a password is hashed
    BCRYPT_LOG_ROUNDS = 12

    # Logging configuration
    LOG_LEVEL = logging.DEBUG
    LOG_FILENAME = "logs/default.log"
    LOG_MAXBYTES = 1024
    LOG_BACKUPS = 2

    # Maintenance Mode
    MAINTENANCE = os.environ.get('MAINTENANCE')

    @staticmethod
    def init_app(app):
        pass
