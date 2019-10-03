import logging
import os

from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_API_URL = os.environ.get("MAIL_API_URL")
    MAIL_API_KEY = os.environ.get("MAIL_API_KEY")
    MAIL_API_DEBUG = os.environ.get("MAIL_API_DEBUG") or "no"
    MAIL_FROM = os.environ.get("MAIL_FROM")
    LANGUAGES = ["en", "es"]
    TIMEZONE = "Europe/Paris"
    ASSETREV_MANIFEST_FILE = os.environ.get("ASSETREV_MANIFEST_FILE")
    ASSETREV_RELOAD = os.environ.get('DEBUG')

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
