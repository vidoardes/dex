import requests
from time import time
from flask import current_app


def send_email(subject, sender, recipients, text_body, html_body, send_time=time()):
    return requests.post(
        current_app.config.get('MAIL_API_URL'),
        auth=("api", current_app.config.get('MAIL_API_KEY')),
        data={"from": "Living DEX " + sender,
              "o:deliverytime": send_time,
              "o:testmode": current_app.config.get('MAIL_API_DEBUG'),
              "to": recipients,
              "subject": subject,
              "text": text_body,
              "html": html_body}
    )
