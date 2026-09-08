from django.urls import path
from . import views
urlpatterns = [
    path('', views.services),
    path('services/', views.ServiceAPIView.as_view()),
    path('features/', views.FeatureAPIView.as_view()),
    path('testimonials/', views.TestimonialAPIView.as_view()),
    path('contact/', views.ContactAPIView.as_view()),
    path('email-subscription/', views.EmailSubscriptionAPIView.as_view()),
    path('faq/', views.FAQAPIView.as_view()),
    path('team/', views.TeamAPIView.as_view()),
    path('partner/', views.PartnerAPIView.as_view()),
    path('pricing/', views.PricingAPIView.as_view()),
    path('about/', views.AboutAPIView.as_view()),
    path('privacy-policy/', views.PrivacyPolicyAPIView.as_view()),
    path('terms-and-conditions/', views.TermsAndConditionsAPIView.as_view()),
]
