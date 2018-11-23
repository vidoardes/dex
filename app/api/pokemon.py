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
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    pokemon_list = []
    list = request.args.get("list", "default")
    cat = request.args.get("cat", "all")
    gen = request.args.get("gen", "all")
    own = request.args.get("own", "all")
    name = request.args.get("name", None)

    filtered_query = Pokemon.query.filter_by(in_game=True).filter_by(released=True)

    if name is not None:
        filtered_query = filtered_query.filter_by(name=name)

    if gen != "all":
        filtered_query = filtered_query.filter_by(gen=gen)

    if cat == "lucky":
        filtered_query = filtered_query.filter_by(mythical=False)

    if cat not in ("all", "lucky"):
        filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    for key, value in json.loads(user.settings)["view-settings"].items():
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
        merge_dict_lists(
            "forme",
            pokemon_list,
            json.loads(user.pokemon_owned).get(list, []),
            append=False,
        ),
        key=lambda k: (k["p_uid"]),
    )

    if "show-spinda" in json.loads(user.settings)["view-settings"]:
        if not json.loads(user.settings)["view-settings"]["show-spinda"]:
            for p in pokemon:
                if p["forme"] == "Spinda #1":
                    p["forme"] = p["name"]

    if "show-unown" in json.loads(user.settings)["view-settings"]:
        if not json.loads(user.settings)["view-settings"]["show-unown"]:
            for p in pokemon:
                if p["forme"] == "Unown (F)":
                    p["forme"] = p["name"]

    if not own == "all":
        _pokemon_owned = []

        for p in pokemon:
            if cat not in ["shiny", "lucky"]:
                _owned = p.get("owned", False)
            elif cat == "shiny":
                _owned = p.get("shinyowned", False)
            elif cat == "lucky":
                _owned = p.get("luckyowned", False)

            if (own == "owned" and _owned) or (own == "notowned" and not _owned):
                _pokemon_owned.append(p)

        pokemon = _pokemon_owned

    r = json.dumps({"success": True, "pokemon": pokemon})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/pokemon/update", methods=["PUT"])
@login_required
def update_pokemon(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    if current_user.username == user.username:
        list = request.args.get("list", "default")
        pokemon = json.loads(request.form.get("data"))

        if pokemon["forme"] == "Spinda":
            pokemon["forme"] = "Spinda #1"

        if pokemon["forme"] == "Unown":
            pokemon["forme"] = "Unown (F)"

        ul = merge_dict_lists(
            "forme", json.loads(user.pokemon_owned).get(list, []), [pokemon]
        )

        user.pokemon_owned = json.dumps({list: ul})
        db.session.commit()

        updated_pokemon = pokemon

        for p in json.loads(user.pokemon_owned).get(list, []):
            if p["forme"] == pokemon["forme"]:
                updated_pokemon = p
                break

        updated_pokemon_list = merge_dict_lists(
            "forme",
            [updated_pokemon],
            [Pokemon.query.filter_by(forme=pokemon["forme"]).first_or_404().as_dict()],
        )

        for p in updated_pokemon_list:
            view_settings = json.loads(user.settings)["view-settings"]

            if "show-spinda" in view_settings:
                if not view_settings["show-spinda"] and p["forme"] == "Spinda #1":
                    p["forme"] = "Spinda"

            if "show-unown" in view_settings:
                if not view_settings["show-unown"] and p["forme"] == "Unown (F)":
                    p["forme"] = "Unown"

        r = json.dumps({"success": True, "updated_pokemon": updated_pokemon_list})
        return Response(r, status=200, mimetype="application/json")
    else:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")


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

    r = json.dumps({"success": True, "egghatches": egg_hatches})
    return Response(r, status=200, mimetype="application/json")
