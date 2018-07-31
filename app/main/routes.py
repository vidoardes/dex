from flask import render_template, flash, redirect, url_for, request, json
from flask_login import current_user, login_required

from app import db
from app.main import bp
from app.main.forms import EditProfileForm
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


@bp.route('/user/<username>')
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()
    return render_template('main/user.html', user=user)


@bp.route("/api/<username>/pokemon/get", methods=['GET'])
@login_required
def fetch(username):
    user = User.query.filter_by(username=username).first_or_404()

    pokemon_list = []
    cat = request.args.get('cat', 'all')
    gen = request.args.get('gen', 'all')

    query = Pokemon.query
    filtered_query = query.filter_by(released=True)

    if cat != 'all':
        filtered_query = filtered_query.filter(getattr(Pokemon, cat), True)

    if gen != 'all':
        filtered_query = filtered_query.filter_by(gen=gen)

    if user is not None:
        for u in filtered_query.all():
            pokemon = u.__dict__
            pokemon.pop('_sa_instance_state', None)
            pokemon_list.append(pokemon)

        print(json.loads(user.pokemon_owned))

        pokemon = sorted(merge_dict_lists('name', pokemon_list, json.loads(user.pokemon_owned), append=False),
                         key=lambda k: k['dex'])

        return json.dumps({'success': True, 'pokemon': pokemon}), 200, {'ContentType': 'application/json'}
    else:
        return json.dumps({'success': False}), 403, {'ContentType': 'application/json'}



@bp.route("/api/<username>/pokemon/update", methods=['POST'])
@login_required
def update(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        r = merge_dict_lists('name',
                             json.loads(user.pokemon_owned),
                             [json.loads(request.form.get('data'))])

        user.pokemon_owned = json.dumps(r)
        db.session.commit()

        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
    else:
        return json.dumps({'success': False}), 403, {'ContentType': 'application/json'}


@bp.route("/api/users/get", methods=['GET'])
@login_required
def fetch_users():
    users = User.query.filter_by(is_public=True).all()
    public_users = []

    for u in users:
        user = u.__dict__['username']
        public_users.append(user)

    if len(public_users) > 0:
        print(public_users)
        return json.dumps({'success': True, 'users': public_users}), 200, {'ContentType': 'application/json'}
    else:
        return json.dumps({'success': False}), 403, {'ContentType': 'application/json'}


@bp.route('/edit_profile/<username>', methods=['GET', 'POST'])
@login_required
def edit_profile(username):
    user = User.query.filter_by(username=username).first_or_404()

    if current_user.username == user.username:
        form = EditProfileForm(current_user.username)

        if form.validate_on_submit():
            user.set_password(form.password.data)
            db.session.commit()
            flash('Your changes have been saved.')
            return redirect(url_for('edit_profile'))
        elif request.method == 'GET':
            form.email.data = current_user.email

        return render_template('main/edit_profile.html', title='Edit Profile', form=form)
    else:
        return json.dumps({'success': False}), 403, {'ContentType': 'application/json'}
