from flask import request, json
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
            .all()
    )

    for u in users:
        user = {
            "title": u.username,
            "description": "L" + str(u.player_level) + " " + u.player_team,
            "url": "/user/" + u.username,
        }

        public_users.append(user)

    return (
        json.dumps({"success": True, "results": public_users}),
        200,
        {"ContentType": "application/json"},
    )


@bp.route("/user/<username>/update", methods=["PUT"])
@login_required
def update_user(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        data = json.loads(request.form.get("data"))
        user.taken_tour = data.get('tour')
        db.session.commit()
        return json.dumps({"success": True}), 200, {"ContentType": "application/json"},
    else:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}
