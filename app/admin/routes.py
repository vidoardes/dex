from datetime import datetime as dt
from time import time
from threading import Thread

from flask import json, request, Response, render_template, current_app
from flask_login import current_user, login_required

from app import db
from app.admin import bp
from app.admin.email import send_update_email
from app.models import User, Event, Pokemon


def is_user_admin():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")


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

    is_user_admin()

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
    is_user_admin()

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


@bp.route("/api/pokemon/get", methods=["GET"])
@login_required
def get_all_pokemon():
    is_user_admin()

    r = {
        "success": True,
        "results": []
    }

    q = request.args.get("q", "")

    pokemon = (
        Pokemon.query
        .filter_by(mega=False)
        .filter(Pokemon.forme.ilike("%" + str(q) + "%"))
        .order_by(Pokemon.p_uid)
        .limit(10)
        .all()
    )

    for p in pokemon:
        p_data = {
            "name": p.forme,
            "value": p.p_uid,
            "text": p.forme,
            "image": f"../static/img/sprites/{p.gen}/pokemon_icon_{p.p_uid}.png",
            "imageClass": "ui avatar mini image",
        }

        r["results"].append(p_data)

    return Response(json.dumps(r), status=200, mimetype="application/json")


@bp.route("/api/pokemon/update", methods=["POST"])
@login_required
def update_pokemon():
    is_user_admin()

    data = json.loads(request.form.get("data"))

    if data["pokemon"] == "":
        pokemon = (
            Pokemon.query
            .all()
        )
    else:
        pokemon = (
            Pokemon.query
            .filter(Pokemon.p_uid.in_(data["pokemon"].split(',')))
            .all()
        )

    if data["type"] == "hatch":
        for p in pokemon:
            p.hatch = data["value"] if data["value"] != "" else None
    elif data["type"] == "raid":
        for p in pokemon:
            p.raid = data["value"] if data["value"] != "" else None

    db.session.commit()
    db.session.close()

    r = {
        "success": True,
        "results": []
    }

    return Response(json.dumps(r), status=200, mimetype="application/json")
