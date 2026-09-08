from django.db import models

# Create your models here.

class Service(models.Model):
    service_id=models.AutoField(primary_key=True)
    service_name=models.CharField(max_length=50)
    service_description=models.TextField()
    service_price=models.FloatField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.service_name
    
class Feature(models.Model):
    feature_id=models.AutoField(primary_key=True)
    service_id=models.ForeignKey(Service,on_delete=models.CASCADE)
    feature_name=models.CharField(max_length=50)
    feature_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.feature_name
    
class Testimonial(models.Model):
    testimonial_id=models.AutoField(primary_key=True)
    user_id=models.CharField(max_length=50)
    user_name=models.CharField(max_length=50)
    user_image=models.ImageField(upload_to='testmonial_images',default='default.jpg')
    testimonial=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user_name
    
class Contact(models.Model):
    contact_id=models.AutoField(primary_key=True)
    name=models.CharField(max_length=50)
    email=models.EmailField()
    phone=models.CharField(max_length=15)
    message=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
class EmailSubscription(models.Model):
    subscription_id=models.AutoField(primary_key=True)
    email=models.EmailField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email
    
class FAQ(models.Model):
    faq_id=models.AutoField(primary_key=True)
    question=models.CharField(max_length=100)
    answer=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question
    
class About(models.Model):
    about_id=models.AutoField(primary_key=True)
    about_title=models.CharField(max_length=100)
    about_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.about_title
    
class Team(models.Model):
    team_id=models.AutoField(primary_key=True)
    team_name=models.CharField(max_length=50)
    team_designation=models.CharField(max_length=50)
    team_image=models.ImageField(upload_to='team_images',default='default.jpg')
    team_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.team_name
    
class Partner(models.Model):
    partner_id=models.AutoField(primary_key=True)
    partner_name=models.CharField(max_length=50)
    partner_image=models.ImageField(upload_to='partner_images',default='default.jpg')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.partner_name
    
class Pricing(models.Model):
    pricing_id=models.AutoField(primary_key=True)
    pricing_name=models.CharField(max_length=50)
    pricing_price=models.FloatField()
    pricing_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.pricing_name
    

class PrivacyPolicy(models.Model):
    privacy_policy_id=models.AutoField(primary_key=True)
    privacy_policy_title=models.CharField(max_length=100)
    privacy_policy_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.privacy_policy_title
    
class TermsAndConditions(models.Model):
    terms_and_conditions_id=models.AutoField(primary_key=True)
    terms_and_conditions_title=models.CharField(max_length=100)
    terms_and_conditions_description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.terms_and_conditions_title
    

