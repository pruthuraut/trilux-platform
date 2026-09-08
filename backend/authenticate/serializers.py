from rest_framework import serializers
# from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

from .models import *
User=get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields=['email','password']

    def create(self,validated_data):
        user=User.objects.create(email=validated_data['email'])
        user.set_password(validated_data['password'])
        user.save()
        return user
    
class verifyOTPSerializer(serializers.Serializer):
    # class Meta:
    #     model = User
    #     fields=['email','otp']
    email=serializers.EmailField()
    otp=serializers.CharField()

class forgotPasswordSerializer(serializers.Serializer):
        email=serializers.EmailField()

class resetPasswordSerializer(serializers.Serializer):
        email=serializers.EmailField()
        otp=serializers.CharField()
        resetToken=serializers.CharField()
        password=serializers.CharField()
        confirmPassword=serializers.CharField()

        def validate(self, data):
            if data['password']!=data['confirmPassword']:
                raise serializers.ValidationError('Password and confirm password not matched')

            if not len(data['password'])>7:
                raise serializers.ValidationError('Password length should be greater than or equal to 8')
            return data
 
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields='__all__'

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields='__all__'


class ValidateTokenSerializer(serializers.Serializer):
    """
    Serializer for token validation requests
    """
    token = serializers.CharField(required=False, help_text="JWT token to validate")
    
    class Meta:
        fields = ['token']


class UUIDLoginSerializer(serializers.Serializer):
    """
    Serializer for UUID-based login with lifetime valid token
    """
    uuid = serializers.CharField(help_text="UUID for authentication")
    user_id = serializers.IntegerField(default=1, help_text="User ID to login (default: 1)")
    
    def validate_user_id(self, value):
        """Validate that user exists"""
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User with id {value} does not exist")
        return value


class DemoAccessAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for DemoAccessAccount model
    """
    class Meta:
        model = DemoAccessAccount
        fields = ['id', 'uuid', 'user', 'organization', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateDemoUserSerializer(serializers.Serializer):
    """
    Serializer for creating demo user with organization
    """
    email = serializers.EmailField(help_text="Email for the demo user")
    organization_name = serializers.CharField(max_length=100, help_text="Name of the organization")
    organization_email = serializers.EmailField(help_text="Organization email")
    organization_phone = serializers.CharField(max_length=15, help_text="Organization phone")
    organization_address = serializers.CharField(help_text="Organization address")
    business_type = serializers.CharField(max_length=50, default="Technology", help_text="Type of business")
    country = serializers.CharField(max_length=50, default="USA", help_text="Country")
    city = serializers.CharField(max_length=50, default="San Francisco", help_text="City")
    postal_code = serializers.CharField(max_length=10, default="94105", help_text="Postal code")
    user_name = serializers.CharField(max_length=150, required=False, help_text="Full name of the user")
    user_role = serializers.CharField(max_length=50, required=False, help_text="User role in organization")
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value
    
    def validate_organization_email(self, value):
        """Check if organization email already exists"""
        if Organization.objects.filter(organization_email=value).exists():
            raise serializers.ValidationError("Organization with this email already exists")
        return value
    
    def create(self, validated_data):
        """
        Create a new demo user with organization
        """
        import uuid as uuid_module
        
        # Create user
        user = User.objects.create(
            email=validated_data['email'],
            is_user=True
        )
        user.set_password(uuid_module.uuid4().hex[:16])  # Random password
        user.save()
        
        # Create organization
        organization = Organization.objects.create(
            organization_name=validated_data['organization_name'],
            description=f"Demo organization for {validated_data['email']}",
            business_type=validated_data.get('business_type', 'Technology'),
            organization_email=validated_data['organization_email'],
            organization_phone=validated_data['organization_phone'],
            organization_address=validated_data['organization_address'],
            country=validated_data.get('country', 'USA'),
            city=validated_data.get('city', 'San Francisco'),
            postal_code=validated_data.get('postal_code', '94105'),
            created_by=user
        )
        
        # Create user profile
        UserProfile.objects.create(
            user_id=user,
            name=validated_data.get('user_name', user.email),
            role=validated_data.get('user_role', 'Admin'),
            Organization=organization
        )
        
        # Create demo access account
        demo_access = DemoAccessAccount.objects.create(
            uuid=str(uuid_module.uuid4()),
            user=user,
            organization=organization,
            is_active=True
        )
        
        return {
            'user': user,
            'organization': organization,
            'demo_access': demo_access
        }
