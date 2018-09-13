from flask import request, json
from flask_login import login_required, current_user

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
    user = User.query.filter_by(username=username).first_or_404()

    if user is None or (not user.is_public and current_user.username != user.username):
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}

    pokemon_list = []
    list = request.args.get("list", "default")
    cat = request.args.get("cat", "all")
    gen = request.args.get("gen", "1")
    own = request.args.get("own", "all")
    name = request.args.get("name", None)

    filtered_query = Pokemon.query.filter_by(in_game=True).filter_by(released=True)

    if name is not None:
        filtered_query = filtered_query.filter_by(name=name)

    if gen not in ("all"):
        filtered_query = filtered_query.filter_by(gen=gen)

    if cat not in ("all", "lucky"):
        filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    for u in filtered_query.all():
        pokemon_list.append(u.as_dict())

    pokemon = sorted(
        merge_dict_lists(
            "name",
            pokemon_list,
            json.loads(user.pokemon_owned).get(list, []),
            append=False,
        ),
        key=lambda k: (k["dex"], k["img_suffix"]),
    )

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

    return (
        json.dumps({"success": True, "pokemon": pokemon}),
        200,
        {"ContentType": "application/json"},
    )


@bp.route("/<username>/pokemon/update", methods=["PUT"])
@login_required
def update_pokemon(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        list = request.args.get("list", "default")

        r = merge_dict_lists(
            "name",
            json.loads(user.pokemon_owned).get(list, []),
            [json.loads(request.form.get("data"))],
        )

        user.pokemon_owned = json.dumps({list: r})
        db.session.commit()

        return json.dumps({"success": True}), 200, {"ContentType": "application/json"}
    else:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}


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

    return (
        json.dumps({"success": True, "raidbosses": raid_bosses}),
        200,
        {"ContentType": "application/json"},
    )


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

    return (
        json.dumps({"success": True, "egghatches": egg_hatches}),
        200,
        {"ContentType": "application/json"},
    )
