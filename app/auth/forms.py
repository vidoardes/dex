from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    BooleanField,
    SubmitField,
    IntegerField,
    RadioField,
)
from wtforms.validators import (
    DataRequired,
    ValidationError,
    Email,
    EqualTo,
    NumberRange,
    Length,
)

from app.models import User


class Unique(object):
    def __init__(self, model, field, message):
        self.model = model
        self.field = field
        self.message = message

    def __call__(self, form, field):
        check = self.model.query.filter(self.field == field.data).first()
        if check:
            raise ValidationError(self.message)


class LoginForm(FlaskForm):
    email = StringField(
        "Email Address",
        validators=[
            DataRequired("Email address is required"),
            Email("This field requires a valid email address"),
        ],
    )
    password = PasswordField(
        "Password", validators=[DataRequired("Password cannot be blank")]
    )
    remember_me = BooleanField("Remember me?")
    submit = SubmitField("Sign In")


class RegistrationForm(FlaskForm):
    username = StringField("Trainer Name", validators=[DataRequired()])

    email = StringField(
        validators=[
            DataRequired(),
            Email(),
            Unique(
                User, User.email, "This email address is already linked to an account."
            ),
        ],
        description="Email address",
    )
    password = PasswordField(
        validators=[
            DataRequired(),
            Length(min=6),
            EqualTo("confirm", message="Passwords must match."),
        ],
        description="Password",
    )
    confirm = PasswordField(description="Confirm password")
    player_level = IntegerField(
        "Trainer Level", validators=[DataRequired(), NumberRange(1, 40)]
    )
    player_team = RadioField(
        "Select Your Team",
        choices=[
            ("Mystic", "Mystic"),
            ("Instinct", "Instinct"),
            ("Valor", "Valor"),
            ("Harmony", "Harmony"),
        ],
        validators=[DataRequired()],
    )
    submit = SubmitField("Register")

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError("That player name is already registered")


class ConfirmEmailForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    submit = SubmitField("Request Confirmation Email")


class ResetPasswordRequestForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    submit = SubmitField("Request Password Reset")


class ResetPasswordForm(FlaskForm):
    password = PasswordField("Password", validators=[DataRequired()])
    password2 = PasswordField(
        "Repeat Password", validators=[DataRequired(), EqualTo("password")]
    )
    submit = SubmitField("Reset Your Password")
