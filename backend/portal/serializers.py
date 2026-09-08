from rest_framework import serializers
from .models import *

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields='__all__'

class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = About
        fields='__all__'

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields='__all__'

class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields='__all__'

class PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pricing
        fields='__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields='__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields='__all__'

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields='__all__'

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields='__all__'

class EmailSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSubscription
        fields='__all__'

class PrivacyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacyPolicy
        fields='__all__'

class TermsAndConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsAndConditions
        fields='__all__'