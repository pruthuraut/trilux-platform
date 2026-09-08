# serializers.py:
from rest_framework import serializers
from django.db import models
from django.core import validators
from .models import *

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class StaticAnalysisSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    class Meta:
        model = StaticAnalysis
        fields = ['id', 'scan_uuid', 'static_analysis_type', 'source_type', 'source_url', 'source_file',
                  'LLM_analysis_result', 'CVEscan_analysis_result', 'GitLeaks_analysis_result',
                  'Taint_analysis_result', 'repo_folder_name', 'static_analysis_status', 'analysis_count',
                  'error_message', 'created_at', 'updated_at', 'user_id', 'project']
    def get_project(self, obj):
        return {'id':obj.project.pk,'project_name':obj.project.project_name}if obj.project else None 

class DynamicAnalysisSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    class Meta:
        model = DynamicAnalysis
        fields = ['id', 'scan_uuid', 'dynamic_analysis_type', 'source_url', 'Nuclei_analysis_result',
                  'dynamic_analysis_status', 'error_message', 'created_at', 'updated_at', 
                  'user_id', 'project']
    def get_project(self, obj):
        return {'id':obj.project.pk,'project_name':obj.project.project_name}if obj.project else None 
    
    # def create(self, validated_data):
    #     project = validated_data.get('project')
    #     if not project:
    #         raise serializers.ValidationError("Project ID is required.")
    #     return super().create(validated_data)
    
class VulnerabilityAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = VulnerabilityAnalysis
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'report_uuid', 'user_id', 'project_id', 'organization_id', 'report_url', 'created_at', 'updated_at']

class SecurityPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityPolicy
        fields = '__all__'

class SecurityAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityAlert
        fields = '__all__'

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = '__all__'

class SupportChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportChat
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class DashboardAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardAnalytics
        fields = '__all__'

class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class TestingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testing
        fields = '__all__'

class EarlyAccessUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarlyAccessUser
        fields = ['email']
        
    def validate(self, data):
        email = data.get('email')
        
        if EarlyAccessUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': "You have already applied for early access. We will prioritize your request and provide access soon."
            })
        elif validators.EmailValidator()(email):
            raise serializers.ValidationError({
                'email': "Please enter a valid email address."
            })
        
        return data

class ContactFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactForm
        fields = ['name', 'email', 'message', 'phone_number', 'organization_name']

    def validate(self, data):
        email = data.get('email')
        phone_number = data.get('phone_number')
        
        # Check if user already submitted with this email or phone number and hasn't been responded to
        existing_form = ContactForm.objects.filter(
            models.Q(email=email) | models.Q(phone_number=phone_number),
            is_responded=False  # Only check for unresponded forms
        ).first()
        
        if existing_form:
            raise serializers.ValidationError({
                    'email': "You have already submitted a contact form. We will get back to you soon."
                })
        
        elif validators.EmailValidator()(email):
            raise serializers.ValidationError({
                'email': "Please enter a valid email address."
            })
        elif validators.RegexValidator(regex=r'^\+?1?\d{9,15}$')(phone_number):
            raise serializers.ValidationError({
                'phone_number': "Please enter a valid phone number."
            })
        return data


class MobileAppAnalysisSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    
    class Meta:
        model = MobileAppAnalysis
        fields = [
            'id', 'scan_uuid', 'app_name', 'app_type', 'app_file', 'file_size',
            'analysis_result', 'mobile_app_analysis_status',
            'total_vulnerabilities', 'critical_count', 'high_count',
            'medium_count', 'low_count', 'error_message',
            'created_at', 'updated_at', 'user_id', 'project'
        ]
        read_only_fields = [
            'id', 'scan_uuid', 'analysis_result', 'mobile_app_analysis_status',
            'total_vulnerabilities', 'critical_count', 'high_count',
            'medium_count', 'low_count', 'error_message',
            'created_at', 'updated_at'
        ]
    
    def get_project(self, obj):
        if obj.project:
            return {
                'id': obj.project.pk,
                'project_name': obj.project.project_name
            }
        return None


class BrowserExtensionAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for Browser Extension security analysis."""
    project = serializers.SerializerMethodField()
    
    class Meta:
        model = BrowserExtensionAnalysis
        fields = [
            'id', 'scan_uuid', 'extension_name', 'extension_version', 
            'extension_type', 'extension_file', 'file_size',
            'manifest_version', 'permissions', 'analysis_result', 
            'browser_extension_analysis_status',
            'total_vulnerabilities', 'code_vulnerabilities', 'permission_issues',
            'critical_count', 'high_count', 'medium_count', 'low_count',
            'risk_score', 'error_message',
            'created_at', 'updated_at', 'user_id', 'project'
        ]
        read_only_fields = [
            'id', 'scan_uuid', 'extension_version', 'manifest_version', 
            'permissions', 'analysis_result', 'browser_extension_analysis_status',
            'total_vulnerabilities', 'code_vulnerabilities', 'permission_issues',
            'critical_count', 'high_count', 'medium_count', 'low_count',
            'risk_score', 'error_message',
            'created_at', 'updated_at'
        ]
    
    def get_project(self, obj):
        if obj.project:
            return {
                'id': obj.project.pk,
                'project_name': obj.project.project_name
            }
        return None

class SCAAnalysisSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()

    class Meta:
        model = SCAAnalysis
        fields = [
            'id', 'scan_uuid', 'source_type', 'source_url', 'source_file',
            'sca_analysis_status', 'analysis_result', 'total_dependencies',
            'total_vulnerabilities', 'code_vulnerabilities', 'critical_count',
            'high_count', 'medium_count', 'low_count', 'error_message',
            'created_at', 'updated_at', 'user_id', 'project',
        ]
        read_only_fields = [
            'id', 'scan_uuid', 'sca_analysis_status', 'analysis_result',
            'total_dependencies', 'total_vulnerabilities', 'code_vulnerabilities',
            'critical_count', 'high_count', 'medium_count', 'low_count',
            'error_message', 'created_at', 'updated_at',
        ]

    def get_project(self, obj):
        if obj.project:
            return {'id': obj.project.pk, 'project_name': obj.project.project_name}
        return None


class SASTTriageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SASTTriage
        fields = ['id', 'project', 'fingerprint', 'status', 'note',
                  'cwe', 'sink', 'title', 'triaged_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'triaged_by', 'created_at', 'updated_at']
