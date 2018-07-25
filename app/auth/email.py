from app.email import send_email
from flask import render_template, current_app


def send_confirm_email(user):
    token = user.get_password_token()
    send_email('[Dex] Confirm Your Email',
               sender=current_app.config['MAIL_FROM'],
               recipients=[user.email],
               text_body=render_template('auth/email/confirm_email.txt',
                                         user=user, token=token),
               html_body=render_template('auth/email/confirm_email.html',
                                         user=user, token=token))


def send_password_reset_email(user):
    token = user.get_password_token()
    send_email('[Dex] Reset Your Password',
               sender=current_app.config['MAIL_FROM'],
               recipients=[user.email],
               text_body=render_template('auth/email/reset_password.txt',
                                         user=user, token=token),
               html_body=render_template('auth/email/reset_password.html',
                                         user=user, token=token))
