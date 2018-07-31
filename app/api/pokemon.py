from flask import request, json
from flask_login import login_required, current_user

from app import db
from app.main import bp
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

    pokemon_list = []
    cat = request.args.get("cat", "all")
    gen = request.args.get("gen", "all")

    query = Pokemon.query
    filtered_query = query.filter_by(released=True)

    if cat != "all":
        filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    if gen != "all":
        filtered_query = filtered_query.filter_by(gen=gen)

    if user is not None:
        for u in filtered_query.all():
            pokemon = u.__dict__
            pokemon.pop("_sa_instance_state", None)
            pokemon_list.append(pokemon)

        print(json.loads(user.pokemon_owned))

        pokemon = sorted(
            merge_dict_lists(
                "name", pokemon_list, json.loads(user.pokemon_owned), append=False
            ),
            key=lambda k: k["dex"],
        )

        return (
            json.dumps({"success": True, "pokemon": pokemon}),
            200,
            {"ContentType": "application/json"},
        )
    else:
        return json.dumps({"success": False}), 403, {"ContentType": "application/json"}


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
