from flask import request, json
from flask_login import login_required

from app.main import bp
from app.models import User


@bp.route("/users/get", methods=['GET'])
@login_required
def fetch_users():
    q = request.args.get('q', '')

    users = User.query.filter_by(is_public=True).filter(
        User.username.like("%" + str(q) + "%")).all()
    public_users = []

    for u in users:
        search_result = {}

        search_result['title'] = u.username
        search_result['description'] = 'L' + str(u.player_level) + ' ' + u.player_team
        search_result['url'] = '/user/' + u.username

        public_users.append(search_result)

    return json.dumps({'success': True, 'results': public_users}), 200, {
        'ContentType': 'application/json'}
