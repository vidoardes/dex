from datetime import datetime as dt
from time import time
from threading import Thread

from flask import json, request, Response, render_template, current_app
from flask_login import current_user, login_required

from app import db
from app.admin import bp
from app.admin.email import send_update_email
from app.models import User, Event


@bp.route("/", methods=["GET"])
@login_required
def admin_functions():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    return render_template("admin/main.html")


@bp.route("/api/send_update_email", methods=["POST"])
@login_required
def bulk_email():
    def email_send_thread(app, recipients, jid, data):
        with app.app_context():
            active_event = Event.query.get(jid)
            delay = 0

            try:
                for r in recipients:
                    send_update_email(r, time() + delay, data)

                    delay += 10

                    d = dict(active_event.event_data)
                    d["sent_list"].append(r["email"])
                    d["sent"] += 1

                    active_event.event_data = d
                    active_event.last_updated = dt.now()

                    db.session.commit()
                    db.session.refresh(active_event)
            except:
                active_event.status = "failed"
                active_event.last_updated = dt.now()
                db.session.commit()
                db.session.close()

            active_event.status = "complete"
            active_event.last_updated = dt.now()
            db.session.commit()
            db.session.close()

    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    data = json.loads(request.form.get("data"))
    print(data)

    u_query = (
        User.query.filter(User.last_logged_in.isnot(None))
        .filter_by(unsubscribe=False)
        .filter_by(deleted=False)
        .all()
    )

    users = []

    for u in u_query:
        users.append({"username": u.username, "email": u.email})

    event_data = {"sent": 0, "sent_list": [], "total": len(users)}

    event = Event(
        event_type="EmailNewsletter1",
        event_data=event_data,
        status="processing",
        job_started=dt.now(),
        last_updated=dt.now(),
    )

    db.session.add(event)
    db.session.commit()

    event_id = event.id

    db.session.close()

    Thread(
        target=email_send_thread, args=(current_app._get_current_object(), users, event_id, data)
    ).start()

    r = json.dumps(
        {
            "success": True,
            "emails-sent": event_data["sent"],
            "total": event_data["total"],
            "event-id": event_id,
        }
    )
    return Response(r, status=200, mimetype="application/json")


@bp.route("/api/check_email_send", methods=["GET"])
@login_required
def check_email_send():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    event_id = request.args.get("eid")
    active_event = Event.query.get(event_id)

    if active_event is None:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    active_event_data = active_event.event_data

    r = {
        "success": True,
        "status": active_event.status,
        "emails-sent": active_event_data["sent"],
        "total": active_event_data["total"],
    }

    if active_event_data == "failed":
        r["success"] = False
        return Response(json.dumps(r), status=200, mimetype="application/json")

    return Response(json.dumps(r), status=200, mimetype="application/json")
