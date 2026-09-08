from django.shortcuts import render
from .serializers import *
import json
import random
import string
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.http.response import HttpResponse
from .models import *
from trilux.celery import app
from .serializers import *
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .tasks import (
    sendEmailTask, sendForgotEmailTask, sendScheduleEmailTask,
    OTP_KEY_PREFIX, OTP_VALIDITY_KEY_PREFIX, VERIFICATION_STATUS_KEY_PREFIX, RESET_TOKEN_KEY_PREFIX
)
from django_celery_beat.models import PeriodicTask, CrontabSchedule, IntervalSchedule
from datetime import datetime, timedelta
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout
from pathlib import Path
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

# Create your views here.
User = get_user_model()

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request):
        try:
            # Get the refresh token from the request data
            refresh_token = request.data.get("refresh")

            # Check if the refresh token is provided
            if not refresh_token:
                return Response({"error": "Refresh token not provided."}, status=status.HTTP_300_MULTIPLE_CHOICES)

            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@ratelimit(key='user_or_ip', rate='5/m', method='ALL', block=True)
def sign_in(request):
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        # Check if user is in temporary Redis storage (not yet verified)
        temp_user_key = f"auth:temp_user:{email}"
        temp_user = cache.get(temp_user_key)
        
        if temp_user:
            # User exists in Redis but not verified yet
            verification_status = cache.get(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
            
            if verification_status == "pending":
                return Response({
                    "message": "Account Not Verified",
                    "temp_user": True
                    }, status=status.HTTP_403_FORBIDDEN)
        
        # Try to authenticate the user from the database
        user = authenticate(username=email, password=password)
        
        if user:
            if user.is_user == False:
                user.is_user = True
                user.save()
                
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": str(user),
                "message": "Login Success",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Invalid Credentials'
                },
                status=status.HTTP_404_NOT_FOUND
                )
    except Exception as e:
        print(e)
        return Response({
            'message': 'Something went wrong',
            'error': str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
            )
    
# Timer function to call invalidate password task after 10 min
def callInvalidateOTP(email):
    print("INVALIDATE OTP CALLED ✅ 🦋")
    randomNum = random.randint(0, 99999999)
    hour = datetime.now().hour
    minutes = datetime.now().minute + 10
    # what if someone using this function at **:59 minutes 
    if minutes > 59:
        hour = hour + 1
        minutes = minutes - 59
        print("TIME: ")
        print(str(hour) + ":" + str(minutes))
    schedule, created = CrontabSchedule.objects.get_or_create(
        hour=hour,
        minute=minutes,
        )
    PeriodicTask.objects.create(
        crontab=schedule,
        name='schedule_Invalidate_otp_task_' + str(randomNum),
        task='authenticate.tasks.invalidateOTP', 
        kwargs=json.dumps({"email": email, "name": 'schedule_Invalidate_otp_task_' + str(randomNum)}),
        )
    return HttpResponse('timer start of 10min to invalidate otp')

class sign_up(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "message": "Invalid Input",
                "error": serializer.errors
                },
                status=status.HTTP_403_FORBIDDEN
                )
        
        email = serializer.validated_data['email']
        
        # Check if email already exists in database
        if User.objects.filter(email=email).exists():
            return Response({
                "message": "Email already registered",
                "error": "Email already exists"
                },
                status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if user exists in Redis
        temp_user_key = f"auth:temp_user:{email}"
        temp_user = cache.get(temp_user_key)
        
        if temp_user:
            # User registration is in progress, resend OTP
            otp_validity = cache.get(f"{OTP_VALIDITY_KEY_PREFIX}{email}")
            verification_status = cache.get(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
            
            if verification_status == "pending" and otp_validity == "false":
                # OTP expired, send new one
                sendEmailTask.delay(email)
                cache.set(f"{OTP_VALIDITY_KEY_PREFIX}{email}", "true", timeout=60*10)
                callInvalidateOTP(email)
                
                return Response({
                    "message": "OTP send on " + email + " Successfully.",
                    "temp_user": True
                    },
                    status=status.HTTP_200_OK
                    )
            elif verification_status == "pending" and otp_validity == "true":
                return Response({
                    "message": "Please verify OTP sent to your email.",
                    "temp_user": True
                    },
                    status=status.HTTP_200_OK
                    )
        
        try:
            # Store validated data in Redis instead of creating user
            # Exclude the password for now from the payload
            user_data = serializer.validated_data.copy()
            password = user_data.pop('password')
            
            # Hash the password before storing
            from django.contrib.auth.hashers import make_password
            hashed_password = make_password(password)
            
            # Convert the user data to a dictionary suitable for JSON serialization
            # and add the hashed password
            user_dict = {}
            for key, value in user_data.items():
                if isinstance(value, (str, int, bool, float, type(None))):
                    user_dict[key] = value
            
            user_dict['password'] = hashed_password
            
            # Store the user data in Redis with a longer timeout (1 hour)
            cache.set(temp_user_key, json.dumps(user_dict), timeout=60*60)
            
            # Send email with OTP
            sendEmailTask.delay(email)
            
            # Schedule OTP invalidation
            callInvalidateOTP(email)
            
            return Response({
                "message": "OTP sent to " + email + " Successfully. Please verify to complete registration.",
                "temp_user": True
                },
                status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong",
                    "error": str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                    )

class forgot_password(APIView):
    def post(self, request):
        serializer = forgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "message": "Invalid Input",
                "error": serializer.errors
                },
                status=status.HTTP_403_FORBIDDEN
                )
                
        email = serializer.data['email']
        
        # Check if user exists in database
        user = User.objects.filter(email=email)
        
        if not user.exists():
            # Also check if there's a temporary user in Redis
            temp_user_key = f"auth:temp_user:{email}"
            temp_user = cache.get(temp_user_key)
            
            if not temp_user:
                return Response({
                    "message": "User not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                    )
        
        try:    
            # Send OTP via email
            sendForgotEmailTask.delay(email)
        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
                )
                
        # Generate reset token and store in Redis
        resetToken = ''.join(random.choices(string.ascii_lowercase + string.digits, k=50))
        
        # Store reset token in Redis
        cache.set(f"{RESET_TOKEN_KEY_PREFIX}{email}", resetToken, timeout=60*30)  # 30 minutes timeout
        cache.set(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}", "reset", timeout=60*30)
        
        # Schedule OTP invalidation
        callInvalidateOTP(email)
        
        return Response({
            "message": "OTP sent to " + email + " successfully.",
            "resetToken": resetToken
            },
            status=status.HTTP_200_OK)

class reset_password(APIView):
    def post(self, request):
        serializer = resetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "message": "Invalid Input",
                "error": serializer.errors
                },
                status=status.HTTP_403_FORBIDDEN
                )
                
        email = serializer.data['email']
        resetToken = serializer.data['resetToken']
        new_password = serializer.data['password']
        otp = serializer.data['otp']
        
        # Get data from Redis
        stored_reset_token = cache.get(f"{RESET_TOKEN_KEY_PREFIX}{email}")
        stored_otp = cache.get(f"{OTP_KEY_PREFIX}{email}")
        stored_status = cache.get(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")

        # Check if reset token is valid
        if not stored_reset_token or stored_reset_token != resetToken:
            return Response({
                "message": "Invalid Reset Token",
            }, status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if OTP is valid
        if not stored_otp or otp != stored_otp:
            return Response({
                "message": "Invalid OTP",
            }, status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if verification status is correct
        if stored_status == "reset":
            # Check if this is for a temporary user or a real user
            temp_user_key = f"auth:temp_user:{email}"
            temp_user_data = cache.get(temp_user_key)
            
            if temp_user_data:
                # Temporary user - update password in Redis
                user_data = json.loads(temp_user_data)
                
                # Hash the new password
                from django.contrib.auth.hashers import make_password
                user_data['password'] = make_password(new_password)
                
                # Store updated data back in Redis
                cache.set(temp_user_key, json.dumps(user_data), timeout=60*60)
            else:
                # Real user - update password in database
                user = User.objects.filter(email=email).first()
                if not user:
                    return Response({
                        "message": "User not found",
                    }, status=status.HTTP_404_NOT_FOUND)
                
                user.set_password(new_password)
                user.save()
            
            # Clear Redis reset data
            cache.delete(f"{RESET_TOKEN_KEY_PREFIX}{email}")
            cache.delete(f"{OTP_KEY_PREFIX}{email}")
            cache.delete(f"{OTP_VALIDITY_KEY_PREFIX}{email}")
            cache.delete(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
            
            return Response({
                "message": "Password changed successfully"
                },
                status=status.HTTP_200_OK
                )
        else:
            return Response({
                "message": "Invalid verification status",
            }, status=status.HTTP_400_BAD_REQUEST
            )
     
class verify_OTP(APIView):
    def post(self, request):
        print("IN verifyOTP field 🔢")
        try:
            data = request.data
            serializer = verifyOTPSerializer(data=data)
            
            if serializer.is_valid():
                email = serializer.data['email']
                otp = serializer.data['otp']
                
                # Get OTP from Redis
                stored_otp = cache.get(f"{OTP_KEY_PREFIX}{email}")
                stored_status = cache.get(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
                
                if not stored_otp or stored_otp != otp:
                    return Response({
                        "message": "Invalid OTP"
                        },
                        status=status.HTTP_400_BAD_REQUEST
                        )
                
                if stored_status != "pending":
                    return Response({
                        "message": "Account already verified or in reset process"
                        },
                        status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Check if this is a new user or existing user
                temp_user_key = f"auth:temp_user:{email}"
                temp_user_data = cache.get(temp_user_key)
                
                if temp_user_data:
                    # This is a new user, create account in database
                    user_data = json.loads(temp_user_data)
                    
                    try:
                        # Create the user in the database
                        user = User.objects.create(
                            email=email,
                            password=user_data['password'],  # Already hashed in sign_up
                            is_user=True
                        )
                        
                        # If additional fields exist in UserSerializer, set them here
                        # Example: if 'first_name' in user_data: user.first_name = user_data['first_name']
                        
                        user.save()
                        
                        # Generate tokens for the new user
                        refresh = RefreshToken.for_user(user)
                        
                        # Clear Redis data
                        cache.delete(temp_user_key)
                        cache.delete(f"{OTP_KEY_PREFIX}{email}")
                        cache.delete(f"{OTP_VALIDITY_KEY_PREFIX}{email}")
                        cache.delete(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
                        
                        return Response({
                            "message": "Account verified and created successfully",
                            "refresh": str(refresh),
                            "access": str(refresh.access_token),
                            },
                            status=status.HTTP_200_OK
                            )
                    except Exception as e:
                        return Response({
                            "message": "Error creating user",
                            "error": str(e)
                            },
                            status=status.HTTP_400_BAD_REQUEST
                            )
                else:
                    # This is an existing user trying to verify OTP
                    # (for password reset or other verification)
                    user = User.objects.filter(email=email).first()
                    
                    if not user:
                        return Response({
                            "message": "User not found"
                            },
                            status=status.HTTP_404_NOT_FOUND
                            )
                    
                    # Clear Redis data
                    cache.delete(f"{OTP_KEY_PREFIX}{email}")
                    cache.delete(f"{OTP_VALIDITY_KEY_PREFIX}{email}")
                    cache.delete(f"{VERIFICATION_STATUS_KEY_PREFIX}{email}")
                    
                    return Response({
                        "message": "Account verified successfully"
                        },
                        status=status.HTTP_200_OK
                        )
                    
        except Exception as e:
            return Response({
                "ERROR": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
                )

class UserProfileAPIView(APIView):
    # authentication_classes=[JWTAuthentication]
    # permission_classes=[IsAuthenticated]
    def get(self, request):
        user_profile_id = request.data.get('user_profile_id')
        if user_profile_id == 0:
            return Response({"detail": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
        try: 
            if user_profile_id:
                user_profile = UserProfile.objects.filter(user_profile_id=user_profile_id).first()
                if user_profile:
                    serializer = UserProfileSerializer(user_profile)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    return Response({"detail": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                mentor_profiles = UserProfile.objects.all()
                serializer = UserProfileSerializer(mentor_profiles, many=True)
                return Response({"payload":serializer.data})
        except Exception as e:
            print(f"ERROR: {e}")
            return Response({"detail": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            existing_profile = UserProfile.objects.filter(user_id=user_id).first()

            if existing_profile:
                # Update existing profile
                serializer = UserProfileSerializer(existing_profile, data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
            else:
                # Create new profile
                serializer.save()

            return Response({"message":"Profile Updated Successfully", "payload":serializer.data}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]
    def get(self, request, id):
        if id == 0:
            return Response({"detail": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            if id:
                organization = Organization.objects.filter(id=id).first()
                if organization:
                    serializer = OrganizationSerializer(organization)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    return Response({"detail": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                organizations = Organization.objects.all()
                serializer = OrganizationSerializer(organizations, many=True)
                return Response(serializer.data)
        except Exception as e:
            print(f"ERROR: {e}")
            return Response({"detail": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"Organization Created Successfully", "payload":serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, id):
        organization = Organization.objects.filter(id=id).first()
        if organization:
            serializer = OrganizationSerializer(organization, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message":"Organization Updated Successfully", "payload":serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, id):
        organization = Organization.objects.filter(id=id).first()
        if organization:
            organization.delete()
            return Response({"message":"Organization Deleted Successfully"}, status=status.HTTP_200_OK)
        return Response({"detail": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)


class ValidateTokenAPIView(APIView):
    """
    Validate JWT token endpoint
    """
    def post(self, request):
        try:
            # Get token from request data or Authorization header
            token = request.data.get('token')
            
            if not token:
                # Try to get token from Authorization header
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return Response({
                    "valid": False,
                    "message": "Token not provided"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Validate the token using UntypedToken
                UntypedToken(token)
                
                # If we reach here, token is valid
                return Response({
                    "valid": True,
                    "message": "Token is valid"
                }, status=status.HTTP_200_OK)
                
            except TokenError as e:
                return Response({
                    "valid": False,
                    "message": "Token is invalid or expired",
                    "error": str(e)
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                "valid": False,
                "message": "Something went wrong",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UUIDLoginView(APIView):
    """
    GET API endpoint for UUID-based login with lifetime valid access token.
    Validates UUID against DemoAccessAccount table and returns a lifetime-valid access token if valid.
    """
    permission_classes = []
    authentication_classes = []
    
    def get(self, request):
        """
        Login with UUID and get lifetime valid access token.
        
        Query Parameters:
        - uuid (required): UUID string for authentication
        
        Example:
        GET /auth/uuid-login/?uuid=550e8400-e29b-41d4-a716-446655440000
        
        Response:
        {
            "access": "jwt-token",
            "refresh": "refresh-token",
            "user": "user-email",
            "user_id": 1,
            "message": "Login Success",
            "token_type": "Bearer",
            "expires_in": "Lifetime"
        }
        """
        try:
            # Get UUID from query parameters
            uuid_value = request.query_params.get('uuid', '').strip()
            
            # Validate UUID is provided
            if not uuid_value:
                return Response({
                    "message": "UUID is required",
                    "error": "uuid query parameter is missing or empty"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if UUID exists in DemoAccessAccount table
            try:
                demo_account = DemoAccessAccount.objects.get(uuid=uuid_value, is_active=True)
            except DemoAccessAccount.DoesNotExist:
                return Response({
                    "message": "Invalid UUID",
                    "error": "UUID not found or inactive"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get the associated user
            user = demo_account.user
            if not user:
                return Response({
                    "message": "User not found for this UUID",
                    "error": "No user associated with this UUID"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Generate tokens with lifetime validity
            # Create custom token class with no expiration
            class LifetimeAccessToken(RefreshToken):
                token_type = 'access'
                
                @classmethod
                def for_user(cls, user):
                    token = cls()
                    token['user_id'] = user.pk
                    token['email'] = user.email
                    return token
            
            # Override the token lifetime to be essentially unlimited
            access_token = LifetimeAccessToken.for_user(user)
            refresh = RefreshToken.for_user(user)
            
            # Set no expiration for access token (use a very large timestamp)
            # This makes the token valid for approximately 68 years
            access_token.set_exp(lifetime=timedelta(days=365*68))
            
            return Response({
                "user": user.email,
                "user_id": user.id,
                "message": "Login Success",
                "access": str(access_token),
                "refresh": str(refresh),
                "token_type": "Bearer",
                "expires_in": "Lifetime"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in UUID Login: {str(e)}")
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateDemoUserView(APIView):
    """
    POST API endpoint to create a new demo user with organization and demo access account.
    
    Request body:
    {
        "email": "user@example.com",
        "organization_name": "Demo Org",
        "organization_email": "org@example.com",
        "organization_phone": "+1234567890",
        "organization_address": "123 Main St",
        "business_type": "Technology",
        "country": "USA",
        "city": "San Francisco",
        "postal_code": "94105",
        "user_name": "John Doe",
        "user_role": "Admin"
    }
    
    Response:
    {
        "user_id": 1,
        "email": "user@example.com",
        "organization_id": 1,
        "organization_name": "Demo Org",
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "message": "Demo user created successfully"
    }
    """
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        """
        Create a new demo user with organization.
        """
        try:
            serializer = CreateDemoUserSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response({
                    "message": "Invalid Input",
                    "error": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user, organization, and demo access account
            result = serializer.save()
            
            user = result['user']
            organization = result['organization']
            demo_access = result['demo_access']
            
            return Response({
                "user_id": user.id,
                "email": user.email,
                "organization_id": organization.id,
                "organization_name": organization.organization_name,
                "uuid": demo_access.uuid,
                "message": "Demo user created successfully",
                "next_step": f"Use UUID to login: GET /auth/uuid-login/?uuid={demo_access.uuid}"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating demo user: {str(e)}")
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DemoAccessAccountListView(APIView):
    """
    GET/POST endpoint to list and manage demo access accounts for authenticated users.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        """
        Get all demo access accounts for the current user.
        """
        try:
            demo_accounts = DemoAccessAccount.objects.filter(user=request.user)
            serializer = DemoAccessAccountSerializer(demo_accounts, many=True)
            
            return Response({
                "count": demo_accounts.count(),
                "results": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "message": "Error fetching demo accounts",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """
        Create a new demo access account for the current user.
        """
        try:
            import uuid as uuid_module
            
            # Get user's organization
            user_org = None
            if request.user.userprofile_set.exists():
                user_org = request.user.userprofile_set.first().Organization
            
            # Create demo access account
            demo_access = DemoAccessAccount.objects.create(
                uuid=str(uuid_module.uuid4()),
                user=request.user,
                organization=user_org,
                is_active=True
            )
            
            serializer = DemoAccessAccountSerializer(demo_access)
            
            return Response({
                "message": "Demo access account created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "message": "Error creating demo access account",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)