import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trilux.settings')

app = Celery('trilux')
app.conf.enable_utc=False
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.update(timezone='Asia/Kolkata')
app.autodiscover_tasks()

app.conf.beat_scheduler={}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')