from datetime import datetime
from hashlib import md5
from time import time

import jwt
import math
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
    pokemon_owned = db.Column(db.Text, nullable=False, default="{}")
    email_registered = db.Column(db.Boolean, default=False, nullable=False)
    email_registered_on = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, default=False, nullable=True)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    created = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    settings = db.Column(db.Text, nullable=False, default="[]")
    taken_tour = db.Column(db.Boolean, nullable=False, default=False)

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

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

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
    hatch = db.Column(db.Integer, nullable=True)
    raid = db.Column(db.Integer, nullable=True)
    costumed = db.Column(db.Boolean, default=False, nullable=False)
    img_suffix = db.Column(db.String(6), default="_00", nullable=False)
    in_game = db.Column(db.Boolean, default=False, nullable=False)
    base_attack = db.Column(db.Integer, default=1, nullable=False)
    base_defense = db.Column(db.Integer, default=1, nullable=False)
    base_stamina = db.Column(db.Integer, default=1, nullable=False)
    classification = db.Column(db.String(120))
    japanese_name = db.Column(db.String(120))
    type1 = db.Column(db.String(20))
    type2 = db.Column(db.String(20))

    def __repr__(self):
        return "<Profile {}>".format(self.body)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def calc_cp(self, level=40, atk_iv=15, defense_iv=15, stamina_iv=15):
        base_atk = self.base_attack
        base_defense = self.base_defense
        base_stamina = self.base_stamina

        cp_multiplier = CPMultipliers.query.filter_by(level=float(level)).first_or_404()

        atk = base_atk + atk_iv
        defense = (base_defense + defense_iv) ** 0.5
        stamina = (base_stamina + stamina_iv) ** 0.5

        return max(
            10,
            math.floor(
                (atk * defense * stamina * (cp_multiplier.cp_multiplier ** 2)) / 10
            ),
        )

    def calc_raid_cp(self):
        raid_stamina = {1: 600, 2: 1800, 3: 3000, 4: 7500, 5: 12500}
        atk = self.base_attack + 15
        defense = (self.base_defense + 15) ** 0.5
        stamina = (raid_stamina.get(self.raid)) ** 0.5

        return math.floor((atk * defense * stamina) / 10)


class CPMultipliers(db.Model):
    __tablename__ = "cp_multiplier"

    level = db.Column(db.Float, unique=True, primary_key=True)
    cp_multiplier = db.Column(db.Float)

    def __repr__(self):
        return "<Profile {}>".format(self.body)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


@login.user_loader
def load_user(id):
    return User.query.get(id)
