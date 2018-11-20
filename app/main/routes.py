import json

from flask import render_template, abort
from flask_login import current_user

from app.main import bp
from app.models import User


@bp.route("/user/<username>")
def show_user(username):
    user = (
        User.query.filter_by(username=username).filter_by(deleted=False).first_or_404()
    )

    if not user.is_public and current_user.username != user.username:
        abort(403)

    return render_template(
        "main/user.html", user=user, settings=json.loads(user.settings)["view-settings"]
    )
