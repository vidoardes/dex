from flask import render_template, flash, redirect, url_for, request, json, abort
from flask_login import current_user, login_required

from app import db
from app.main import bp
from app.main.forms import EditProfileForm
from app.models import User, Pokemon


@bp.route("/user/<username>")
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username != user.username and not user.is_public:
        abort(404)
    else:
        return render_template("main/user.html", user=user)

