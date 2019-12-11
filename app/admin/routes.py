from time import time

from flask import json, request, Response
from flask_login import current_user, login_required

from app import db
from app.admin import bp
from app.admin.email import send_update_email
from app.models import User


@bp.route("/send_update_email", methods=["GET"])
@login_required
def update_email():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    email = request.args.get("email")

    if email is not None:
        users = User.query.filter_by(email=email).all()
    else:
        users = User.query.filter_by(unsubscribe=False).filter_by(deleted=False).all()

    sent_list = []
    delay = 0

    for u in users:
        send_update_email(u, time() + delay)
        delay += 60
        sent_list.append(u.email)

    db.session.close()
    r = json.dumps({"success": True, "sent-to": json.dumps(sent_list)})
    return Response(r, status=200, mimetype="application/json")
