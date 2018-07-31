from flask import render_template, flash, redirect, url_for, request, json
from flask_login import current_user, login_required

from app import db
from app.main import bp
from app.main.forms import EditProfileForm
from app.models import User, Pokemon


@bp.route("/user/<username>")
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()
    return render_template("main/user.html", user=user)


@bp.route("/edit_profile/<username>", methods=["GET", "POST"])
@login_required
def edit_profile(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        form = EditProfileForm(current_user.username)

        if form.validate_on_submit():
            user.set_password(form.password.data)
            db.session.commit()
            flash("Your changes have been saved.")
            return redirect(url_for("edit_profile"))
        elif request.method == "GET":
            form.email.data = current_user.email

        return render_template(
            "main/edit_profile.html", title="Edit Profile", form=form
        )
    else:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}
