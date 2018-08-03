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
@login_required
def fetch(username):
    user = User.query.filter_by(username=username).first_or_404()

    if user is None or not user.is_public:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}

    pokemon_list = []
    cat = request.args.get("cat", "all")
    gen = request.args.get("gen")
    own = request.args.get("own", "all")
    name = request.args.get("name", None)

    if gen == None:
        gen = "1"

    filtered_query = Pokemon.query.filter_by(in_game=True).filter_by(released=True)

    if name is not None:
        filtered_query = filtered_query.filter_by(name=name)
    else:
        filtered_query = filtered_query.filter_by(gen=gen)

        if cat != "all":
            filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    for u in filtered_query.all():
        pokemon_list.append(u.as_dict())

    pokemon = sorted(
        merge_dict_lists(
            "name", pokemon_list, json.loads(user.pokemon_owned), append=False
        ),
        key=lambda k: (k["dex"], k["img_suffix"]),
    )

    if not own == "all":
        _pokemon_owned = []

        for p in pokemon:
            if cat not in ["shiny", "alolan"]:
                _owned = p.get("owned", False)
            elif cat == "shiny":
                _owned = p.get("shinyowned", False)
            elif cat == "alolan":
                _owned = p.get("alolanowned", False)

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
def update(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        r = merge_dict_lists(
            "name",
            json.loads(user.pokemon_owned),
            [json.loads(request.form.get("data"))],
        )

        user.pokemon_owned = json.dumps(r)
        db.session.commit()

        return json.dumps({"success": True}), 200, {"ContentType": "application/json"}
    else:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}
