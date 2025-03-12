from flask_wtf import FlaskForm
from wtforms import StringField, EmailField, TextAreaField
from wtforms.validators import DataRequired, Email, Length

class ContactForm(FlaskForm):
    name = StringField('Name', validators=[
        DataRequired(),
        Length(min=2, max=100)
    ])
    email = EmailField('Email', validators=[
        DataRequired(),
        Email(message="Please enter a valid email address")
    ])
    message = TextAreaField('Message', validators=[
        DataRequired(),
        Length(min=10, max=2000)
    ])

class NewsletterForm(FlaskForm):
    email = EmailField('Email', validators=[
        DataRequired(),
        Email(message="Please enter a valid email address")
    ])
