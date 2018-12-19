from datetime import datetime

from flask import render_template, flash, redirect, url_for, request, current_app
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse

from app import db
from app.auth import bp
from app.auth.email import send_password_reset_email, send_confirm_email
from app.auth.forms import (
    LoginForm,
    RegistrationForm,
    ResetPasswordRequestForm,
    ResetPasswordForm,
    ConfirmEmailForm,
)
from app.models import User


@bp.before_request
def check_for_maintenance():
    if current_app.config["MAINTENANCE"] == "TRUE" and request.path != url_for(
        "auth.maintenance"
    ):
        return redirect(url_for("auth.maintenance"))


@bp.route("/maintenance", methods=["GET"])
def maintenance():
    if current_app.config["MAINTENANCE"] == "TRUE":
        return render_template("auth/maintenance.html", title="Maintenance")
    else:
        return redirect(url_for("auth.login"))


@bp.route("/", methods=["GET", "POST"])
@bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.show_user", username=current_user.username))

    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()

        if user is None or not user.check_password(form.password.data):
            flash("Invalid username or password", "error")
            return redirect(url_for("auth.login"))

        if user.deleted:
            flash("You have deleted your account", "error")
            return redirect(url_for("auth.login"))

        if not user.email_registered:
            flash(
                "You have not yet confirmed your account. Please check your email.",
                "error",
            )
            return redirect(url_for("auth.login"))

        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get("next")
        user.last_logged_in = datetime.now()
        db.session.commit()

        if not next_page or url_parse(next_page).netloc != "":
            next_page = url_for("main.show_user", username=current_user.username)

        return redirect(next_page)

    return render_template("auth/login.html", title="Sign In", form=form)


@bp.route("/logout", methods=["GET"])
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))


@bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.show_user", username=current_user.username))

    form = RegistrationForm()

    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data.lower(),
            player_level=form.player_level.data,
            player_team=form.player_team.data,
            email_registered=False,
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        send_confirm_email(user)
        flash("A confirmation link has been sent via email.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html", title="Register", form=form)


@bp.route("/confirm_email/<token>")
def confirm_email(token):
    if current_user.is_authenticated:
        return redirect(url_for("auth.login"))

    user = User.verify_password_token(token)

    if not user:
        flash("The confirmation link is invalid or has expired", "warning")
        return redirect(url_for("auth.resend_confirmation"))

    if user.email_registered:
        flash("Account already confirmed. Please login.", "success")
        return redirect(url_for("auth.login"))
    else:
        user.email_registered = True
        user.email_registered_on = datetime.now()
        db.session.add(user)
        db.session.commit()
        flash("You have confirmed your account. Thanks! You can now login", "success")
        return redirect(url_for("auth.login"))


@bp.route("/resend_confirmation", methods=["GET", "POST"])
def resend_confirmation():
    form = ConfirmEmailForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()

        if user is None:
            print("user none")
            flash("Email is not registered", "error")
            return redirect(url_for("auth.resend_confirmation"))

        if user.email_registered:
            print("user already reg")
            flash(
                "You have already confirmed your account. Please login below.",
                "success",
            )
            return redirect(url_for("auth.login"))

        send_confirm_email(user)
        flash("A confirmation link has been sent via email.", "success")
        return redirect(url_for("auth.login"))

    return render_template(
        "auth/resend_token.html", title="Resend Confirmation Email", form=form
    )


@bp.route("/reset_password_request", methods=["GET", "POST"])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for("auth.login"))

    form = ResetPasswordRequestForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()

        if user:
            send_password_reset_email(user)

        flash("Check your email for the instructions to reset your password", "info")
        return redirect(url_for("auth.login"))

    return render_template(
        "auth/reset_password_request.html", title="Reset Password", form=form
    )


@bp.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for("auth.login"))

    user = User.verify_password_token(token)

    if not user:
        return redirect(url_for("auth.login"))

    form = ResetPasswordForm()

    if form.validate_on_submit():
        user.set_password(form.password.data)
        db.session.commit()
        flash("Your password has been reset.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/reset_password.html", form=form)
