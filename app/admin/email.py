import time
from app.email import send_email
from flask import render_template, current_app


def send_update_email(user):
    send_email(
        subject=str(
            "[Dex] New Updates Released! - " + time.strftime("%A, %d %B", time.gmtime())
        ),
        sender=current_app.config["MAIL_FROM"],
        recipients=[user.email],
        text_body=render_template("admin/email/update_email.txt", user=user),
        html_body=render_template("admin/email/update_email.html", user=user),
    )
