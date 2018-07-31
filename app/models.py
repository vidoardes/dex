from datetime import datetime
from hashlib import md5
from time import time

import jwt
from flask import current_app, url_for
from flask_login import UserMixin

from app import db, login, bcrypt


class User(UserMixin, db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    player_level = db.Column(db.Integer, nullable=False, default=0)
    player_team = db.Column(db.String(10), default="Harmony", nullable=False)
    pokemon_owned = db.Column(db.Text, nullable=False, default="[]")
    email_registered = db.Column(db.Boolean, default=False, nullable=False)
    email_registered_on = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False, nullable=True)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    created = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    settings = db.Column(db.Text, nullable=False, default="[]")

    def __repr__(self):
        return "<User {}>".format(self.username)

    def set_password(self, plaintext):
        self.password_hash = bcrypt.generate_password_hash(plaintext).decode("utf-8")

    def check_password(self, plaintext):
        return bcrypt.check_password_hash(self.password_hash, plaintext)

    def avatar(self, size):
        digest = md5(self.email.lower().encode("utf-8")).hexdigest()
        return "https://www.gravatar.com/avatar/{}?d=identicon&s={}".format(
            digest, size
        )

    def get_password_token(self, expires_in=600):
        return jwt.encode(
            {"password_token": self.id, "exp": time() + expires_in},
            current_app.config["SECRET_KEY"],
            algorithm="HS256",
        ).decode("utf-8")

    def to_dict(self, include_email=False):
        data = {
            "id": self.id,
            "username": self.username,
            "last_seen": self.last_seen.isoformat() + "Z",
            "about_me": self.about_me,
            "post_count": self.posts.count(),
            "follower_count": self.followers.count(),
            "followed_count": self.followed.count(),
            "_links": {
                "self": url_for("api.get_user", id=self.id),
                "followers": url_for("api.get_followers", id=self.id),
                "followed": url_for("api.get_followed", id=self.id),
                "avatar": self.avatar(128),
            },
        }
        if include_email:
            data["email"] = self.email
        return data

    @staticmethod
    def verify_password_token(token):
        try:
            id = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )["password_token"]
        except:
            return

        return User.query.get(id)


class Pokemon(db.Model):
    __tablename__ = "pokemon"

    name = db.Column(
        db.String(120), unique=True, default="", primary_key=True, nullable=False
    )
    dex = db.Column(db.Integer, nullable=False)
    shiny = db.Column(db.Boolean, default=False, nullable=False)
    alolan = db.Column(db.Boolean, default=False, nullable=False)
    regional = db.Column(db.Boolean, default=False, nullable=False)
    male = db.Column(db.Boolean, default=False, nullable=False)
    female = db.Column(db.Boolean, default=False, nullable=False)
    ungendered = db.Column(db.Boolean, default=False, nullable=False)
    legendary = db.Column(db.Boolean, default=False, nullable=False)
    mythical = db.Column(db.Boolean, default=False, nullable=False)
    gen = db.Column(db.Integer, default=0, nullable=False)
    released = db.Column(db.Boolean, default=False, nullable=False)
    hatch = db.Column(db.Boolean, default=False, nullable=False)
    raid = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return "<Profile {}>".format(self.body)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


@login.user_loader
def load_user(id):
    return User.query.get(id)
