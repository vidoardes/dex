import re
from flask import request, json, Response
from flask_login import login_required, current_user
from sqlalchemy import func

from app import db
from app.api import bp
from app.models import User, Pokemon


def merge_dict_lists(key, l1, l2, append=True):
    merged = {}

    for item in l1:
        if item[key] in merged:
            merged[item[key]].update(item)
        else:
            merged[item[key]] = item

    for item in l1 + l2:
        if item[key] in merged:
            merged[item[key]].update(item)
        elif append:
            merged[item[key]] = item
    return [val for (_, val) in merged.items()]


@bp.route("/<username>/pokemon/get", methods=["GET"])
def fetch_pokemon(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    if user is None or (not user.is_public and current_user.username != user.username):
        db.session.close()
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    pokemon_list = []
    list = request.args.get("list")
    cat = request.args.get("cat", "all")
    gen = request.args.get("gen", "all")
    own = request.args.get("own", "all")
    name = request.args.get("name", None)

    active_list = next(
        (item for item in user.pokemon_owned if item["value"] == list),
        user.pokemon_owned[0],
    )

    owned_pokemon = active_list["pokemon"]
    pokemon_filters = active_list["view-settings"]
    list_type = active_list["type"]

    filtered_query = Pokemon.query.filter_by(in_game=True).filter_by(released=True)

    if name is not None:
        filtered_query = filtered_query.filter_by(name=name)

    if gen != "all":
        filtered_query = filtered_query.filter_by(gen=gen)

    if cat == "lucky":
        filtered_query = filtered_query.filter_by(mythical=False)

    if cat not in ("all", "lucky"):
        filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    if list_type == "exclusive":
        filtered_query = filtered_query.filter(
            Pokemon.dex.notin_(active_list["exclusions"])
        )
    elif list_type == "inclusive":
        filtered_query = filtered_query.filter(
            Pokemon.dex.in_(active_list["inclusions"])
        )

    for key, value in pokemon_filters.items():
        if key == "show-spinda" and not value:
            filtered_query = filtered_query.filter(
                Pokemon.forme.notin_(
                    [
                        "Spinda #2",
                        "Spinda #3",
                        "Spinda #4",
                        "Spinda #5",
                        "Spinda #6",
                        "Spinda #7",
                        "Spinda #8",
                    ]
                )
            )

        if key == "show-unown" and not value:
            filtered_query = filtered_query.filter(
                Pokemon.forme.notin_(
                    [
                        "Unown (A)",
                        "Unown (B)",
                        "Unown (C)",
                        "Unown (D)",
                        "Unown (E)",
                        "Unown (G)",
                        "Unown (H)",
                        "Unown (I)",
                        "Unown (J)",
                        "Unown (K)",
                        "Unown (L)",
                        "Unown (M)",
                        "Unown (N)",
                        "Unown (O)",
                        "Unown (P)",
                        "Unown (Q)",
                        "Unown (R)",
                        "Unown (S)",
                        "Unown (T)",
                        "Unown (U)",
                        "Unown (V)",
                        "Unown (W)",
                        "Unown (X)",
                        "Unown (Y)",
                        "Unown (Z)",
                        "Unown (!)",
                        "Unown (?)",
                    ]
                )
            )

        if key == "show-castform" and not value:
            filtered_query = filtered_query.filter(
                Pokemon.forme.notin_(
                    ["Sunny Castform", "Rainy Castform", "Snowy Castform"]
                )
            )

        if key == "show-deoxys" and not value:
            filtered_query = filtered_query.filter(
                Pokemon.forme.notin_(
                    [
                        "Deoxys (Attack Forme)",
                        "Deoxys (Defense Forme)",
                        "Deoxys (Speed Forme)",
                    ]
                )
            )

        if key == "show-alolan" and not value:
            filtered_query = filtered_query.filter_by(alolan=False)

        if key == "show-costumed" and not value:
            filtered_query = filtered_query.filter_by(costumed=False)

    for u in filtered_query.all():
        pokemon_list.append(u.as_dict())

    pokemon = sorted(
        merge_dict_lists("forme", pokemon_list, owned_pokemon, append=False),
        key=lambda k: (k["p_uid"]),
    )

    for p in pokemon:
        if (
            ("show-spinda", False) in pokemon_filters.items()
            and p["forme"] == "Spinda #1"
        ) or (
            ("show-unown", False) in pokemon_filters.items()
            and p["forme"] == "Unown (F)"
        ):
            p["forme"] = p["name"]

    if not own == "all":
        _pokemon_owned = []

        for p in pokemon:
            if cat == "shiny":
                _owned = p.get("shinyowned", False)
            elif cat == "lucky":
                _owned = p.get("luckyowned", False)
            else:
                _owned = p.get("owned", False)

            if (own == "owned" and _owned) or (own == "notowned" and not _owned):
                _pokemon_owned.append(p)

        pokemon = _pokemon_owned

    db.session.close()
    r = json.dumps({"success": True, "pokemon": pokemon})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/pokemon/update", methods=["PUT"])
@login_required
def update_pokemon(username):
    if current_user.username != username:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    old_pokemon_owned = user.pokemon_owned
    db.session.close()

    _list = request.args.get("list")

    if list is None:
        db.session.close()
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    updated_pokemon = json.loads(request.form.get("data"))

    active_list = next((d for d in old_pokemon_owned if d["value"] == _list), None)

    if active_list is None:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    if updated_pokemon["forme"] == "Spinda":
        updated_pokemon["forme"] = "Spinda #1"
    elif updated_pokemon["forme"] == "Unown":
        updated_pokemon["forme"] = "Unown (F)"

    ul = merge_dict_lists("forme", active_list["pokemon"], [updated_pokemon])

    active_list["pokemon"] = ul

    new_pokemon_owned = []
    new_pokemon_owned[:] = [d for d in old_pokemon_owned if d.get("value") != _list]
    new_pokemon_owned.append(active_list)

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    for p in ul:
        if p["forme"] == updated_pokemon["forme"]:
            updated_pokemon = p
            break

    updated_pokemon_list = merge_dict_lists(
        "forme",
        [updated_pokemon],
        [
            Pokemon.query.filter_by(forme=updated_pokemon["forme"])
            .first_or_404()
            .as_dict()
        ],
    )

    for p in updated_pokemon_list:
        if (
            ("show-spinda", False) in active_list["view-settings"].items()
            and p["forme"] == "Spinda #1"
        ) or (
            ("show-unown", False) in active_list["view-settings"].items()
            and p["forme"] == "Unown (F)"
        ):
            p["forme"] = p["name"]

    r = json.dumps({"success": True, "updated_pokemon": updated_pokemon_list})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/pokemon/raidbosses/get", methods=["GET"])
@login_required
def fetch_raid_bosses():
    rb_list = (
        Pokemon.query.filter_by(in_game=True)
        .filter_by(released=True)
        .filter(Pokemon.raid > 0)
        .all()
    )
    raid_bosses = {6: [], 5: [], 4: [], 3: [], 2: [], 1: []}

    for rb in rb_list:
        raid_boss = rb.as_dict()
        raid_boss["battle_cp"] = rb.calc_raid_cp()
        raid_boss["max_cp"] = rb.calc_cp(20)
        raid_boss["max_cp_weather"] = rb.calc_cp(25)
        raid_boss["min_cp"] = rb.calc_cp(20, 10, 10, 10)
        raid_boss["min_cp_weather"] = rb.calc_cp(25, 10, 10, 10)

        raid_bosses[rb.raid].append(raid_boss)

    db.session.close()
    r = json.dumps({"success": True, "raidbosses": raid_bosses})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/pokemon/egghatches/get", methods=["GET"])
@login_required
def fetch_egg_hatches():
    eh_list = (
        Pokemon.query.filter_by(in_game=True)
        .filter_by(released=True)
        .filter(Pokemon.hatch > 0)
        .all()
    )
    egg_hatches = {10: [], 7: [], 5: [], 2: []}

    for eh in eh_list:
        egg_hatch = eh.as_dict()

        egg_hatches[eh.hatch].append(egg_hatch)

    db.session.close()
    r = json.dumps({"success": True, "egghatches": egg_hatches})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/dex/add", methods=["PUT"])
@login_required
def add_list(username):
    if current_user.username != username:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    old_pokemon_owned = user.pokemon_owned
    new_list = json.loads(request.form.get("data"))
    db.session.close()

    new_list["value"] = re.sub(
        "[\-=<>|]", "", new_list["name"].lower().replace(" ", "_")
    )
    new_list["type"] = "exclusive"
    new_list["exclusions"] = []
    new_list["view-settings"] = {}
    new_list["pokemon"] = []

    new_pokemon_owned = []
    new_pokemon_owned[:] = [d for d in old_pokemon_owned]
    new_pokemon_owned.append(new_list)

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/dex/get", methods=["GET"])
@login_required
def get_list(username):
    if current_user.username != username:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    list = request.args.get("list")

    rq_list = next((item for item in user.pokemon_owned if item["value"] == list), None)

    _list = {
        "name": rq_list["name"],
        "value": rq_list["value"],
        "colour": rq_list["colour"],
        "view-settings": rq_list["view-settings"],
    }

    db.session.close()

    r = json.dumps({"success": True, "list-settings": _list})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/dex/update", methods=["PUT"])
@login_required
def update_list(username):
    if current_user.username != username:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    old_pokemon_owned = user.pokemon_owned
    updated_list = json.loads(request.form.get("data"))
    db.session.close()

    updated_list["value"] = updated_list["name"].lower().replace(" ", "_")
    _list = next(
        (d for d in old_pokemon_owned if d["value"] == updated_list["old-list"]), None
    )

    _new_list = {**_list, **updated_list}

    new_pokemon_owned = []
    new_pokemon_owned[:] = [
        d for d in old_pokemon_owned if d["value"] != updated_list["old-list"]
    ]
    new_pokemon_owned.append(_new_list)

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
    return Response(r, status=200, mimetype="application/json")
