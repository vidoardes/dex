from flask import request, json
from flask_login import login_required

from app.api import bp
from app.models import User


@bp.route("/users/get", methods=["GET"])
@login_required
def fetch_users():
    q = request.args.get("q", "")

    public_users = []
    users = (
        User.query.filter_by(is_public=True)
        .filter(User.username.like("%" + str(q) + "%"))
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
