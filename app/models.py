from datetime import datetime
from hashlib import md5
from time import time

import jwt
import math
import decimal
from flask import current_app
from flask_login import UserMixin

from app import db, login, bcrypt

from sqlalchemy.ext.hybrid import hybrid_property


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
    last_logged_in = db.Column(db.DateTime, default=datetime.utcnow)

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

    dex = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120), unique=False, default="", nullable=False)
    forme = db.Column(
        db.String(120), unique=True, default="", primary_key=True, nullable=False
    )
    img_suffix = db.Column(db.String(6), default="_00", nullable=False)
    male = db.Column(db.Boolean, default=False, nullable=False)
    female = db.Column(db.Boolean, default=False, nullable=False)
    ungendered = db.Column(db.Boolean, default=False, nullable=False)
    legendary = db.Column(db.Boolean, default=False, nullable=False)
    mythical = db.Column(db.Boolean, default=False, nullable=False)
    baby = db.Column(db.Boolean, default=False, nullable=False)
    gen = db.Column(db.Integer, default=0, nullable=False)
    hatch = db.Column(db.Integer, nullable=True)
    raid = db.Column(db.Integer, nullable=True)
    buddy = db.Column(db.Integer, nullable=False)
    evolve = db.Column(db.Integer, nullable=True)
    evolve_into = db.Column(db.Integer, nullable=True)
    shiny = db.Column(db.Boolean, default=False, nullable=False)
    regional = db.Column(db.Boolean, default=False, nullable=False)
    alolan = db.Column(db.Boolean, default=False, nullable=False)
    costumed = db.Column(db.Boolean, default=False, nullable=False)
    mega = db.Column(db.Boolean, default=False, nullable=False)
    released = db.Column(db.Boolean, default=False, nullable=False)
    in_game = db.Column(db.Boolean, default=False, nullable=False)
    level_1 = db.Column(db.Boolean, default=True, nullable=False)
    classification = db.Column(db.String(120))
    japanese_name_romaji = db.Column(db.String(120))
    japanese_name = db.Column(db.String(120))
    type1 = db.Column(db.String(20))
    type2 = db.Column(db.String(20))
    hp = db.Column(db.Integer, default=1, nullable=False)
    attack = db.Column(db.Integer, default=1, nullable=False)
    defense = db.Column(db.Integer, default=1, nullable=False)
    sp_attack = db.Column(db.Integer, default=1, nullable=False)
    sp_defense = db.Column(db.Integer, default=1, nullable=False)
    speed = db.Column(db.Integer, default=1, nullable=False)
    stat_nerf = db.Column(db.Integer, default=0, nullable=False)
    base_attack_override = db.Column(db.Integer, default=0, nullable=False)
    base_defense_override = db.Column(db.Integer, default=0, nullable=False)
    base_stamina_override = db.Column(db.Integer, default=0, nullable=False)

    @hybrid_property
    def speed_mod(self):
        return 1 + ((self.speed - 75) / 500)

    @hybrid_property
    def stat_nerf_mod(self):
        return (100 - self.stat_nerf) / 100

    @hybrid_property
    def scaled_attack(self):
        sa = 2 * (
            max(self.attack, self.sp_attack) * 0.875
            + min(self.attack, self.sp_attack) * 0.125
        )
        rsa = decimal.Decimal(sa).quantize(0, rounding=decimal.ROUND_HALF_UP)
        return float(rsa)

    @hybrid_property
    def scaled_defense(self):
        sd = 2 * (
            max(self.defense, self.sp_defense) * 0.625
            + min(self.defense, self.sp_defense) * 0.375
        )
        rsd = decimal.Decimal(sd).quantize(0, rounding=decimal.ROUND_HALF_UP)
        return float(rsd)

    @hybrid_property
    def base_attack(self):
        if self.base_attack_override > 0:
            return self.base_attack_override
        else:
            ba = self.scaled_attack * self.speed_mod * self.stat_nerf_mod
            rba = decimal.Decimal(ba).quantize(0, rounding=decimal.ROUND_HALF_UP)
            return float(rba)

    @hybrid_property
    def base_defense(self):
        if self.base_defense_override > 0:
            return self.base_defense_override
        else:
            bd = self.scaled_defense * self.speed_mod * self.stat_nerf_mod
            rda = decimal.Decimal(bd).quantize(0, rounding=decimal.ROUND_HALF_UP)
            return float(rda)

    @hybrid_property
    def base_stamina(self):
        if self.base_stamina_override > 0:
            return self.base_stamina_override
        else:
            bs = (self.hp * 1.75 + 50) * self.stat_nerf_mod

            if self.stat_nerf_mod < 1:
                rbs = decimal.Decimal(bs).quantize(0, rounding=decimal.ROUND_HALF_UP)
            else:
                rbs = math.floor(bs)

            return float(rbs)

    @hybrid_property
    def max_cp(self):
        return self.calc_cp(40, 15, 15, 15)

    def __repr__(self):
        return "<Profile {}>".format(self.body)

    def as_dict(self):
        _dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        _dict["max_cp"] = self.max_cp
        _dict["base_attack"] = self.base_attack
        _dict["base_defense"] = self.base_defense
        _dict["base_stamina"] = self.base_stamina

        return _dict

    def calc_cp(self, level=40, atk_iv=15, defense_iv=15, stamina_iv=15):
        cp_multiplier = CPMultipliers.query.filter_by(level=float(level)).first_or_404()

        atk = self.base_attack + atk_iv
        defense = (self.base_defense + defense_iv) ** 0.5
        stamina = (self.base_stamina + stamina_iv) ** 0.5

        return max(
            10,
            math.floor(
                (atk * defense * stamina * (cp_multiplier.cp_multiplier ** 2)) / 10
            ),
        )

    def calc_raid_cp(self):
        raid_stamina = {1: 600, 2: 1800, 3: 3000, 4: 7500, 5: 12500, 6: 12500}
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
