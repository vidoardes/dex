import re

from flask import request, json, Response
from flask_login import login_required, current_user

from app import db
from app.api import bp
from app.models import User


@bp.route("/users/get", methods=["GET"])
@login_required
def fetch_users():
    q = request.args.get("q", "")

    public_users = []
    users = (
        User.query.filter_by(is_public=True)
        .filter(User.username.ilike("%" + str(q) + "%"))
        .limit(10)
        .all()
    )

    for u in users:
        user = {
            "title": u.username,
            "description": "L" + str(u.player_level) + " " + u.player_team,
            "url": "/user/" + u.username,
        }

        public_users.append(user)

    r = json.dumps({"success": True, "results": public_users})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/user/<username>/settings/get", methods=["GET"])
@login_required
def get_user_settings(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        settings = {
            "config": user.settings,
            "public": user.is_public,
            "email": user.email,
            "player_level": user.player_level,
        }

        r = json.dumps({"success": True, "settings": settings})
        return Response(r, status=200, mimetype="application/json")
    else:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")


@bp.route("/user/<username>/settings/update", methods=["PUT"])
@login_required
def update_user(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        data = json.loads(request.form.get("data"))
        email = data.get("email")
        tour = data.get("tour")
        public = data.get("public")
        player_level = data.get("player_level")

        if tour is not None:
            if isinstance(tour, bool):
                user.taken_tour = tour
            else:
                r = json.dumps({"success": False})
                return Response(r, status=422, mimetype="application/json")

        if public is not None:
            if isinstance(public, bool):
                user.is_public = public
            else:
                r = json.dumps({"success": False})
                return Response(r, status=422, mimetype="application/json")

        if player_level is not None:
            if (
                player_level.isdigit() and re.match("^([1-9]|3[0-9]|40)$", player_level)
            ) or player_level is None:
                user.player_level = player_level
            else:
                r = json.dumps({"success": False})
                return Response(r, status=422, mimetype="application/json")

        if email is not None:
            exists = User.query.filter_by(email=email).all()

            if len(exists) > 0 or not re.match("^[^@]+@[^@]+\.[^@]+$", email):
                r = json.dumps({"success": False})
                return Response(r, status=422, mimetype="application/json")
            else:
                user.email = email

        db.session.commit()

        settings = {
            "config": user.settings,
            "public": user.is_public,
            "email": user.email,
            "player_level": user.player_level,
        }

        r = json.dumps({"success": True, "settings": settings})
        return Response(r, status=200, mimetype="application/json")
    else:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")
