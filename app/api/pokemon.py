import re
from flask import request, json, Response
from flask_login import login_required, current_user
from sqlalchemy import func
from werkzeug.urls import url_encode

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


def generate_list_key(v):
    r = (
        v.lower()
        .replace(" ", "_")
        .replace("+", "plus")
        .replace("-", "negative")
        .replace(">", "gt")
        .replace("<", "lt")
        .replace("|", "pipe")
    )

    return r


def modify_query(**new_values):
    args = request.args.copy()

    for key, value in new_values.items():
        args[key] = value

    return "{}".format(url_encode(args))


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
    user_list = request.args.get("list")
    cat = request.args.get("cat")
    gen = request.args.get("gen")
    own = request.args.get("own")
    name = request.args.get("name", None)
    count = int(request.args.get("c", 0))

    active_list = next(
        (item for item in user.pokemon_owned if item["value"] == user_list),
        user.pokemon_owned[0],
    )

    if gen is not "" and gen is not None:
        gen = gen.split(",")
    else:
        gen = []

    if cat is not "" and cat is not None:
        cat = cat.split(",")
    else:
        cat = []

    owned_pokemon = active_list["pokemon"]
    pokemon_filters = active_list["view-settings"]

    if active_list.get("gen-filters", False):
        for i in active_list.get("gen-filters", "").split(","):
            if i not in gen:
                gen.append(i)

    if active_list.get("cat-filters", False):
        for i in active_list.get("cat-filters", "").split(","):
            if i not in cat:
                cat.append(i)

    updated_qs = modify_query(
        cat=",".join(map(str, cat)),
        gen=",".join(map(str, gen)),
        own=own,
        list=active_list["value"],
    )

    list_type = active_list["type"]

    filtered_query = Pokemon.query.filter_by(in_game=True)

    if "unreleased" not in cat:
        filtered_query = filtered_query.filter_by(released=True)

    if name is not None:
        filtered_query = filtered_query.filter_by(forme=name)

    if "all" not in gen and "" not in gen and len(gen) != 0:
        filtered_query = filtered_query.filter(Pokemon.gen.in_(gen))

    if "lucky" in cat:
        filtered_query = filtered_query.filter_by(mythical=False)

    for i in cat:
        if i not in ("lucky", "unreleased", ""):
            filtered_query = filtered_query.filter(getattr(Pokemon, i), True)

    if list_type == "exclusive":
        filtered_query = filtered_query.filter(
            Pokemon.dex.notin_(active_list["exclusions"])
        )
    elif list_type == "inclusive":
        filtered_query = filtered_query.filter(
            Pokemon.dex.in_(active_list["inclusions"])
        )

    if not pokemon_filters.get("show-spinda", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(
                [
                    "327_12",
                    "327_13",
                    "327_14",
                    "327_15",
                    "327_16",
                    "327_17",
                    "327_18",
                    "327_19",
                    "327_20",
                    "327_21",
                    "327_22",
                    "327_23",
                    "327_24",
                    "327_25",
                    "327_26",
                    "327_27",
                    "327_28",
                    "327_29",
                    "327_30",
                ]
            )
        )

    if not pokemon_filters.get("show-unown", False):
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

    if not pokemon_filters.get("show-castform", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["351_12", "351_13", "351_14"])
        )

    if not pokemon_filters.get("show-deoxys", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["386_12", "386_13", "386_14"])
        )

    if not pokemon_filters.get("show-cherrim", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["421_12"])
        )

    if not pokemon_filters.get("show-burmy", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["412_12", "412_13", "413_12", "413_13"])
        )

    if not pokemon_filters.get("show-shellos", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["422_12", "423_12"])
        )

    if not pokemon_filters.get("show-giratina", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["487_12"])
        )

    if not pokemon_filters.get("show-alolan", False):
        filtered_query = filtered_query.filter_by(alolan=False)

    if not pokemon_filters.get("show-costumed", False):
        filtered_query = filtered_query.filter_by(costumed=False)

    if not pokemon_filters.get("show-letsgo", False):
        filtered_query = filtered_query.filter(
            Pokemon.p_uid.notin_(["808_00", "809_00", "891_00", "892_00"])
        )

    total_owned = 0
    total_pokemon_list = [u.__dict__ for u in filtered_query.all()]
    _pokemon_owned = []

    for p in owned_pokemon:
        if "shiny" in cat:
            _owned = p.get("shinyowned", False)
        elif "lucky" in cat:
            _owned = p.get("luckyowned", False)
        elif "shadow" in cat:
            _owned = p.get("shadowowned", False)
        else:
            _owned = p.get("owned", False)

        if _owned and any(d["forme"] == p["forme"] for d in total_pokemon_list):
            total_owned = total_owned + 1
            _pokemon_owned.append(p["forme"])

    if own == "owned":
        filtered_query = filtered_query.filter(Pokemon.forme.in_(_pokemon_owned))
    elif own == "notowned":
        total_owned = 0
        filtered_query = filtered_query.filter(Pokemon.forme.notin_(_pokemon_owned))

    total_results = filtered_query.count()

    total_pokemon_list = [u.__dict__ for u in filtered_query.all()]

    pokemon_dex = []

    for p in total_pokemon_list:
        pokemon_dex.append(p["dex"])

    pokemon_dex.sort()

    if "shiny" in cat:
        pokemon_dex.append("&shiny")

    if "legendary" in cat:
        pokemon_dex.append("&legendary")

    if "mythical" in cat:
        pokemon_dex.append("&mythical")

    if "lucky" in cat:
        if own == "notowned":
            pokemon_dex.append("&!lucky")
        else:
            pokemon_dex.append("&lucky")

    if "shadow" in cat:
        pokemon_dex.append("&shadow")

    if "alolan" in cat:
        pokemon_dex.append("&alola")

    if "level_1" in cat:
        pokemon_dex.append("&cp10-100")

    if count == 0:
        filtered_query = filtered_query.order_by("p_uid").slice(0, 36)
    elif count >= filtered_query.count():
        db.session.close()
        r = json.dumps({"success": True, "pokemon": "end", "updated-qs": updated_qs})
        return Response(r, status=200, mimetype="application/json")
    else:
        filtered_query = filtered_query.order_by("p_uid").slice(count, count + 36)

    for u in filtered_query.all():
        pokemon_list.append(u.as_dict())

    pokemon = sorted(
        merge_dict_lists("forme", pokemon_list, owned_pokemon, append=False),
        key=lambda k: (k["p_uid"]),
    )

    for p in pokemon:
        if (
            not pokemon_filters.get("show-spinda", False) and p["forme"] == "Spinda #1"
        ) or (
            not pokemon_filters.get("show-unown", False) and p["forme"] == "Unown (F)"
        ) or (
            not pokemon_filters.get("show-burmy", False) and p["forme"] == "Burmy Plant Cloak"
        ) or (
            not pokemon_filters.get("show-burmy", False) and p["forme"] == "Wormadam Plant Cloak"
        ) or (
            not pokemon_filters.get("show-cherrim", False) and p["forme"] == "Cherrim Overcast"
        ) or (
            not pokemon_filters.get("show-shellos", False) and p["forme"] == "Shellos (West Sea)"
        ) or (
            not pokemon_filters.get("show-shellos", False) and p["forme"] == "Gastrodon (West Sea)"
        ) or (
            not pokemon_filters.get("show-giratina", False) and p["forme"] == "Giratina (Altered Forme)"
        ):
            p["forme"] = p["name"]

    db.session.close()
    r = json.dumps(
        {
            "success": True,
            "pokemon": pokemon,
            "dex_str": pokemon_dex,
            "updated-qs": updated_qs,
            "total_results": total_results,
            "total_owned": total_owned,
        }
    )
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

    if _list is None:
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
    elif updated_pokemon["forme"] == "Cherrim":
        updated_pokemon["forme"] = "Overcast Cherrim"
    elif updated_pokemon["forme"] == "Burmy":
        updated_pokemon["forme"] = "Burmy Plant Cloak"
    elif updated_pokemon["forme"] == "Wormadam":
        updated_pokemon["forme"] = "Wormadam Plant Cloak"
    elif updated_pokemon["forme"] == "Shellos":
        updated_pokemon["forme"] = "Shellos (West Sea)"
    elif updated_pokemon["forme"] == "Gastrodon":
        updated_pokemon["forme"] = "Gastrodon (West Sea)"
    elif updated_pokemon["forme"] == "Giratina":
        updated_pokemon["forme"] = "Giratina (Altered Forme)"

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
            (
                "show-spinda" not in active_list["view-settings"].keys()
                or ("show-spinda", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Spinda #1"
        ) or (
            (
                "show-unown" not in active_list["view-settings"].keys()
                or ("show-unown", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Unown (F)"
        ) or (
            (
                "show-burmy" not in active_list["view-settings"].keys()
                or ("show-burmy", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Burmy Plant Cloak"
        ) or (
            (
                "show-burmy" not in active_list["view-settings"].keys()
                or ("show-burmy", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Wormadam Plant Cloak"
        ) or (
            (
                "show-cherrim" not in active_list["view-settings"].keys()
                or ("show-cherrim", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Overcast Cherrim"
        ) or (
            (
                "show-shellos" not in active_list["view-settings"].keys()
                or ("show-shellos", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Shellos (West Sea)"
        ) or (
            (
                "show-shellos" not in active_list["view-settings"].keys()
                or ("show-shellos", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Gastrodon (West Sea)"
        ) or (
            (
                "show-giratina" not in active_list["view-settings"].keys()
                or ("show-giratina", False) in active_list["view-settings"].items()
            )
            and p["forme"] == "Giratina (Altered Forme)"
        ):
            p["forme"] = p["name"]

    r = json.dumps({"success": True, "updated_pokemon": updated_pokemon_list})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/pokemon/raidbosses/get", methods=["GET"])
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


@bp.route("/<username>/dex/get", methods=["GET"])
def get_list(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    list = request.args.get("list")

    rq_list = next((item for item in user.pokemon_owned if item["value"] == list), None)
    db.session.close()

    if rq_list is None:
        r = json.dumps({"success": False})
        return Response(r, status=404, mimetype="application/json")

    _list = {
        "name": rq_list["name"],
        "value": rq_list["value"],
        "colour": rq_list["colour"],
        "view-settings": rq_list["view-settings"],
        "cat-filters": rq_list.get("cat-filters", ""),
        "gen-filters": rq_list.get("gen-filters", ""),
    }

    r = json.dumps({"success": True, "list-settings": _list})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/dex/getall", methods=["GET"])
def get_lists(username):
    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    _lists = []

    for d in user.pokemon_owned:
        _lists.append(
            {
                "name": "<div class='ui "
                + d["colour"]
                + " empty circular label'></div>"
                + d["name"],
                "value": d["value"],
                "text": "<div class='ui "
                + d["colour"]
                + " empty circular label'></div>"
                + d["name"],
            }
        )

    db.session.close()

    r = json.dumps({"success": True, "results": _lists})
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
    _nl = json.loads(request.form.get("data"))
    db.session.close()

    _nl["value"] = generate_list_key(_nl["name"])
    _nl["type"] = "exclusive"
    _nl["exclusions"] = []
    _nl["pokemon"] = []

    d = dict((i["value"], i["name"]) for i in old_pokemon_owned)

    if _nl["value"] in d:
        r = json.dumps({"success": False, "message": "Dex name already exists"})
        return Response(r, status=403, mimetype="application/json")

    new_pokemon_owned = []
    new_pokemon_owned[:] = [d for d in old_pokemon_owned]
    new_pokemon_owned.append(_nl)

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
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
    db.session.close()

    _ul = json.loads(request.form.get("data"))
    _ul["value"] = generate_list_key(_ul["name"])

    new_pokemon_owned = []
    new_pokemon_owned[:] = [
        d for d in old_pokemon_owned if d["value"] != _ul["old-list"]
    ]

    d = dict((i["value"], i["name"]) for i in new_pokemon_owned)

    if _ul["value"] in d:
        r = json.dumps({"success": False, "message": "Dex name already exists"})
        return Response(r, status=403, mimetype="application/json")

    _list = next((d for d in old_pokemon_owned if d["value"] == _ul["old-list"]), None)

    _new_list = {**_list, **_ul}
    _new_list.pop("old-list")

    new_pokemon_owned.append(_new_list)

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
    return Response(r, status=200, mimetype="application/json")


@bp.route("/<username>/dex/delete", methods=["GET"])
@login_required
def delete_list(username):
    if current_user.username != username:
        r = json.dumps({"success": False})
        return Response(r, status=403, mimetype="application/json")

    user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first_or_404()

    old_pokemon_owned = user.pokemon_owned
    
    deleted_list = request.args.get("list")

    new_pokemon_owned = []
    new_pokemon_owned[:] = [d for d in old_pokemon_owned if d["value"] != deleted_list]

    user.pokemon_owned = new_pokemon_owned

    db.session.commit()
    db.session.close()

    r = json.dumps({"success": True})
    return Response(r, status=200, mimetype="application/json")
