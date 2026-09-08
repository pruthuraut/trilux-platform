from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from .manager import UserManager
import uuid

# Create your models here.
class User(AbstractUser):
    username            = None
    email               = models.EmailField(unique=True)
    is_user             = models.BooleanField(default=True)

    USERNAME_FIELD      = 'email'
    REQUIRED_FIELDS     = []
    objects             = UserManager()


class Organization(models.Model):
    # organization_id                     = models.AutoField(primary_key=True)
    organization_name                   = models.CharField(max_length=100)
    description                         = models.TextField()
    website                             = models.URLField(null=True)
    linkedin                            = models.URLField(null=True)
    twitter                             = models.URLField(null=True)
    is_verified                         = models.BooleanField(default=False)
    business_type                       = models.CharField(max_length=50)
    business_registration_certificate   = models.ImageField(upload_to='business_certificate',null=True)
    tax_identification_number           = models.CharField(max_length=50)
    organization_email                  = models.EmailField(unique=True)
    organization_phone                  = models.CharField(max_length=15)
    organization_address                = models.TextField()
    country                             = models.CharField(max_length=50)
    city                                = models.CharField(max_length=50)
    postal_code                         = models.CharField(max_length=10)
    created_at                          = models.DateTimeField(auto_now_add=True)
    updated_at                          = models.DateTimeField(auto_now=True)
    created_by                          = models.ForeignKey(User,on_delete=models.CASCADE)


class UserProfile(models.Model):
    user_profile_id = models.AutoField(primary_key=True)
    user_id         = models.ForeignKey(User,on_delete=models.CASCADE)
    name            = models.CharField(max_length=150, null=True)
    image           = models.ImageField(upload_to='profile_pics',default='default.jpg')
    role            = models.CharField(max_length=50, null=True)
    phone           = models.CharField(max_length=15, null=True)
    address         = models.TextField(null=True)
    Organization    = models.ForeignKey(Organization,on_delete=models.CASCADE)
    last_active     = models.DateTimeField(default=timezone.now)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)


class DemoAccessAccount(models.Model):
    """
    Table to store demo access UUIDs for generating lifetime access tokens
    """
    id              = models.AutoField(primary_key=True)
    uuid            = models.CharField(max_length=255, unique=True, db_index=True, help_text="Unique UUID for demo access")
    user            = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='demo_access')
    organization    = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True, related_name='demo_accesses')
    is_active       = models.BooleanField(default=True, help_text="Whether this demo access is active")
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Demo Access Account"
        verbose_name_plural = "Demo Access Accounts"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Demo Access - {self.uuid[:8]}... ({self.user.email if self.user else 'No User'})"
    