# Generated migration for DemoAccessAccount model

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('authenticate', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DemoAccessAccount',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('uuid', models.CharField(db_index=True, help_text='Unique UUID for demo access', max_length=255, unique=True)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this demo access is active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='demo_accesses', to='authenticate.organization')),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='demo_access', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Demo Access Account',
                'verbose_name_plural': 'Demo Access Accounts',
                'ordering': ['-created_at'],
            },
        ),
    ]
