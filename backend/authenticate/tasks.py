import os
import random
import json
from celery import shared_task
from django.template import loader
from django_celery_beat.models import PeriodicTask
from helpers.smtp_helper import send_email
from trilux.celery import app
from django.conf import settings
from django.core.cache import cache
from .models import User
from datetime import timedelta

# Constants for Redis keys
OTP_KEY_PREFIX = "auth:otp:"
OTP_VALIDITY_KEY_PREFIX = "auth:otp_validity:"
VERIFICATION_STATUS_KEY_PREFIX = "auth:verification_status:"
RESET_TOKEN_KEY_PREFIX = "auth:reset_token:"

# Cache expiration time (10 minutes)
OTP_EXPIRATION = 60 * 10

@shared_task(bind=True)
def sendEmailTask(self, email):
    subject = "✅ Verify Your TRILUX Account Now! 🔒"
    otp = random.randint(100000, 999999)
    html_message = loader.render_to_string('email/verify_email.html', {'otp': otp})

    send_email("TRILUX Admin", email, subject, html_message)

    # Store OTP and verification status in Redis
    cache.set(f"{OTP_KEY_PREFIX}{email}", str(otp), timeout=OTP_EXPIRATION)
    cache.set(f"{OTP_VALIDITY_KEY_PREFIX}{email}", "true", timeout=OTP_EXPIRATION)
    cache.set(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}", "pending", timeout=OTP_EXPIRATION*6)  # Longer timeout for verification status
    
    return f"Verification Email send to: {email} ✅"

@shared_task(bind=True)
def sendForgotEmailTask(self, email):
    subject = "🔄 Reset Your Obsidian Password in a Snap! 🔐"
    otp = random.randint(100000, 999999)
    html_message = loader.render_to_string('email/forgot_password.html', {'otp': otp})
    
    # send_mail(subject, "", 'TRILUX Admin', [email], fail_silently=False, html_message=html_message)
    send_email("TRILUX Admin", email, subject, html_message)

    # Store OTP and verification status in Redis
    cache.set(f"{OTP_KEY_PREFIX}{email}", str(otp), timeout=OTP_EXPIRATION)
    cache.set(f"{OTP_VALIDITY_KEY_PREFIX}{email}", "true", timeout=OTP_EXPIRATION)
    cache.set(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}", "reset", timeout=OTP_EXPIRATION*6)  # Longer timeout for reset process
    
    return f"Forgot Password Email send to: {email} ✅"

@shared_task(bind=True)
def sendScheduleEmailTask(self, email):
    subject = "🔑 Your Obsidian Account Verification Code is Here! 🚀"
    otp = random.randint(100000, 999999)
    html_message = loader.render_to_string('email/forgot_password.html', {'otp': otp})
    
    send_email("Obsedian Admin", email, subject, html_message)
    
    # Store OTP in Redis
    cache.set(f"{OTP_KEY_PREFIX}{email}", str(otp), timeout=OTP_EXPIRATION)
    cache.set(f"{OTP_VALIDITY_KEY_PREFIX}{email}", "true", timeout=OTP_EXPIRATION)
    
    return "DONE"

@shared_task(bind=True)
def invalidateOTP(self, email, name):
    # Invalidate OTP in Redis
    cache.set(f"{OTP_VALIDITY_KEY_PREFIX}{email}", "false", timeout=OTP_EXPIRATION)
    
    # Disable periodic task
    try:
        periodic_task = PeriodicTask.objects.get(name=name)
        periodic_task.enabled = False
        periodic_task.save()
    except PeriodicTask.DoesNotExist:
        pass
    
    return f"SET otp Invalid for {email} ✅"

# Task for sending email to subscribed users
@shared_task(bind=True)
def sendSubscriptionEmailTask(self, email):
    subject="🛡️ Top Strategies to Supercharge Your Organization’s Security! 💪"
    html_message = loader.render_to_string('email/subscription_email.html',{'otp':'otp'})
    send_email("TRILUX Security", email, subject, html_message)
    # write code to tell that email is sent
    # user_obj=User.objects.get(email=email)
    # user_obj.otp=otp
    # user_obj.save()
    return f"Subscription Email send to: {email} ✅"

# Task for sending email for marketing
@shared_task(bind=True)
def sendMarketingEmailTask(self, email):
    subject="🔐✨ Unlock the Power: Your Organization’s Security Key is Here! 🚀🔑" 
    html_message = loader.render_to_string('email/marketing_email.html',{'otp':'otp'})
    send_email("TRILUX Security", email, subject, html_message)
    # write code to tell that email is sent
    # user_obj=User.objects.get(email=email)
    # user_obj.otp=otp
    # user_obj.save()
    return f"Marketing Email send to: {email} ✅" 

# Task to send Valnerability alert 
@shared_task(bind=True)
def sendVulnerabilityEmailTask(self, email):
    subject="⚠️🚨 Critical Alert: Vulnerability Detected in Your Product! 🛡️🔍"
    html_message = loader.render_to_string('email/alert_email.html')
    send_email("TRILUX Alert", email, subject, html_message)
    # write code to tell that email is sent
    # user_obj=User.objects.get(email=email)
    # user_obj.otp=otp
    # user_obj.save()
    return f"Vulnerability Email send to: {email} ✅"

# Task to send invoice email
@shared_task(bind=True)
def sendInvoiceEmailTask(self, email):
    subject="Your Subscription Invoice is Here! 🛡️"
    html_message = loader.render_to_string('email/invoice_email.html')
    send_email("Obsedian Security", email, subject, html_message)
    # write code to tell that email is sent
    # user_obj=User.objects.get(email=email)
    # user_obj.otp=otp
    # user_obj.save()
    return f"Invoice Email send to: {email} ✅"

# Task to send invoice email
@shared_task(bind=True)
def sendWaitlistEmailTask(self, email):
    subject="Congratulations 🎉 You’re on the Obsidian Waitlist!"
    html_message = loader.render_to_string('email/waitlist_email.html')
    send_email("Obsidian Team", email, subject, html_message)
    return f"Waitlist joining Email send to: {email} ✅"

@shared_task(bind=True)
def sendContactFormTask(self, data):
    print(f"Sending contact form email... Data: {data}")
    subject="Thank you for reaching out to TRILUX! 🙌"
    html_message = loader.render_to_string('email/contact_form.html', data)
    send_email("TRILUX Contact", data.get('email'), subject, html_message)
    return f"Contact form submission from {data.get('name')} <{data.get('email')}> sent successfully! ✅"