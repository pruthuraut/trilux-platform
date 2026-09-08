from django.shortcuts import render
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView

from portal.models import *
from portal.serializers import *


class ServiceAPIView(APIView):
    def get(self,request):
        try:
            services=Service.objects.all()
            serializer=ServiceSerializer(services,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})

class FeatureAPIView(APIView):
    def get(self,request):
        try:
            features=Feature.objects.all()
            serializer=FeatureSerializer(features,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class TestimonialAPIView(APIView):
    def get(self,request):
        try:
            testimonials=Testimonial.objects.all()
            serializer=TestimonialSerializer(testimonials,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})

class ContactAPIView(APIView):
    def post(self,request):
        try:
            serializer=ContactSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors)
        except Exception as e:
            return Response({'error':str(e)})
        
class EmailSubscriptionAPIView(APIView):
    def post(self,request):
        try:
            serializer=EmailSubscriptionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors)
        except Exception as e:
            return Response({'error':str(e)})
        
class FAQAPIView(APIView):
    def get(self,request):
        try:
            faqs=FAQ.objects.all()
            serializer=FAQSerializer(faqs,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class AboutAPIView(APIView):
    def get(self,request):
        try:
            abouts=About.objects.all()
            serializer=AboutSerializer(abouts,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class TeamAPIView(APIView):
    def get(self,request):
        try:
            teams=Team.objects.all()
            serializer=TeamSerializer(teams,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class PartnerAPIView(APIView):
    def get(self,request):
        try:
            partners=Partner.objects.all()
            serializer=PartnerSerializer(partners,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class PricingAPIView(APIView):
    def get(self,request):
        try:
            pricings=Pricing.objects.all()
            serializer=PricingSerializer(pricings,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class PrivacyPolicyAPIView(APIView):
    def get(self,request):
        try:
            privacy_policy=PrivacyPolicy.objects.all()
            serializer=PrivacyPolicySerializer(privacy_policy,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})
        
class TermsAndConditionsAPIView(APIView):
    def get(self,request):
        try:
            terms_and_conditions=TermsAndConditions.objects.all()
            serializer=TermsAndConditionSerializer(terms_and_conditions,many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error':str(e)})

# Create your views here.
def services(request):
    return render(request,'index.html',{'page':"ObsediaGuard"})