import os
import requests
from trilux.config import Config

def send_email(from_name, to_email, subject, html_content):
    from_email = Config.SMTP_FROM_EMAIL
    api_key = Config.SENDGRID_API_KEY
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "personalizations": [
            {
                "to": [{"email": to_email}],
                "subject": subject
            }
        ],
        "from": {"email": f"{from_name}<{from_email}>"},
        "content": [
            {
                "type": "text/html",
                "value": html_content
            }
        ]
    }

    response = requests.post(url, headers=headers, json=data)
    print(f"SendGrid response: {response.status_code}, {response.text}")
    return {
        "status_code": response.status_code,
    }
