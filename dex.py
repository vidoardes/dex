from app import create_app, db
from app.models import User

application = create_app()


@application.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User}

if __name__ == '__main__':
    application.run(port=5003, debug=True)