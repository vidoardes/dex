from time import time

from flask import json, Response, render_template
from flask_login import current_user, login_required

from app import db
from app.admin import bp
from app.admin.email import send_update_email
from app.models import User


@bp.route("/", methods=["GET"])
@login_required
def admin_functions():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    return render_template("admin/main.html")


@bp.route("/api/send_update_email", methods=["GET", "POST"])
@login_required
def bulk_email():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    users = User.query.filter(User.last_logged_in.isnot(None)).filter_by(unsubscribe=False).filter_by(deleted=False).all()

    db.session.close()

    sent_list = []
    delay = 0

    try:
        for u in users:
            send_update_email(u, time() + delay)
            delay += 10
            sent_list.append(u.email)
    except:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    r = json.dumps({"success": True, "emails-sent": len(sent_list), "total": len(users)})
    return Response(r, status=200, mimetype="application/json")
