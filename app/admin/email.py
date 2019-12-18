import time
from html2text import html2text

from app.email import send_email
from flask import render_template, current_app


def send_update_email(user, send_time, data):
    html_body = render_template("admin/email/update_email.html", user=user, body=data["body"])
    text_body = html2text(html_body)

    send_email(
        subject=str(
            "[Dex] " + data["subject"] + " - " + time.strftime("%A, %d %B", time.gmtime())
        ),
        sender=current_app.config["MAIL_FROM"],
        recipients=[user["email"]],
        text_body=text_body,
        html_body=html_body,
        send_time=send_time,
    )
