import re

from flask import request, json, Response
from flask_login import login_required, current_user
from sqlalchemy import func

from app import db
from app.api import bp
from app.models import User


@bp.route("/users/get", methods=["GET"])
def fetch_users():
    q = request.args.get("q", "")

    public_users = []
    users = (
        User.query.filter_by(is_public=True)
        .filter_by(deleted=False)
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

    db.session.close()
    r = json.dumps({"success": True, "results": public_users})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/user/<username>/settings/get", methods=["GET"])
@login_required
def get_user_settings(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    if current_user.username == user.username:
        settings = {
            "public": user.is_public,
            "unsubscribe": user.unsubscribe,
            "email": user.email,
            "player_level": user.player_level,
        }
        db.session.close()
        r = json.dumps({"success": True, "settings": settings})
        return Response(r, status=200, mimetype="application/json")
    else:
        db.session.close()
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")


@bp.route("/user/<username>/settings/update", methods=["PUT"])
@login_required
def update_user(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    if current_user.username == user.username:
        data = json.loads(request.form.get("data"))
        email = data.get("email")
        tour = data.get("tour")
        public = data.get("public")
        player_level = data.get("player_level")
        view_settings = data.get("view-settings")
        unsubscribe = data.get("unsubscribe")

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
                player_level.isdigit() and re.match("^([1-9]|2[0-9]|3[0-9]|40)$", player_level)
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

        if view_settings is not None:
            old_settings = json.loads(user.settings)
            old_settings["view-settings"] = dict(
                old_settings["view-settings"], **data["view-settings"]
            )
            user.settings = json.dumps(old_settings)

        if unsubscribe is not None:
            if isinstance(unsubscribe, bool):
                user.unsubscribe = unsubscribe
            else:
                r = json.dumps({"success": False})
                return Response(r, status=422, mimetype="application/json")

        db.session.commit()

        settings = {
            "public": user.is_public,
            "email": user.email,
            "player_level": user.player_level,
        }
        db.session.close()
        r = json.dumps({"success": True, "settings": settings})
        return Response(r, status=200, mimetype="application/json")
    else:
        db.session.close()
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")


@bp.route("/user/<username>/settings/delete", methods=["GET"])
@login_required
def delete_user(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    if current_user.username == user.username:
        user.deleted = True

        db.session.commit()
        db.session.close()
        r = json.dumps({"success": True})
        return Response(r, status=200, mimetype="application/json")
    else:
        db.session.close()
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")
