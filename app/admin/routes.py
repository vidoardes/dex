import copy
from flask import json, Response
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

    users = (
        User.query.filter_by(unsubscribe=False)
        .filter_by(deleted=False)
        .filter_by(email_registered=True)
        .all()
    )

    sent_list = []

    for u in users:
        send_update_email(u)
        sent_list.append(u.email)

    db.session.close()
    r = json.dumps({"success": True, "sent-to": json.dumps(sent_list)})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/upgrade_pokemon_list", methods=["GET"])
@login_required
def upgrade_dict():
    if not current_user.is_admin:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    users = User.query.filter_by(deleted=False).all()

    empty_dict = [
        {
            "name": "Living DEX",
            "value": "default",
            "colour": "red",
            "type": "exclusive",
            "exclusions": [],
            "view-settings": {},
            "pokemon": [],
        }
    ]

    for u in users:
        if u.username == "Mister_MaCoPi":
            print(json.loads(u.pokemon_owned))

        if json.loads(u.pokemon_owned) == {}:
            print('Here!')
            u.pokemon_owned = copy.deepcopy(empty_dict)

            continue

        if "default" in json.loads(u.pokemon_owned):
            new_pokemon_owned = copy.deepcopy(empty_dict)
            old_pokemon_owned = json.loads(u.pokemon_owned)["default"]

            active_list = next(
                (d for d in new_pokemon_owned if d["value"] == "default"), None
            )

            active_list["pokemon"] = old_pokemon_owned
            active_list["view-settings"] = json.loads(u.settings)["view-settings"]

            u.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
    return Response(r, status=200, mimetype="application/json")