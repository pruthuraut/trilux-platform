import uuid
from django.db import models

from authenticate.models import User

# Create your models here.

class Project(models.Model):
    # project_id          = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id             = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id     = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_name        = models.CharField(max_length=50)
    project_description = models.TextField()
    project_type        = models.CharField(max_length=50)
    project_status      = models.CharField(max_length=50, choices=[('Active','Active'),('Completed','Completed'),('On Hold','On Hold'),('Cancelled','Cancelled')], default='Active')
    project_url         = models.URLField(null=True)
    project_logo        = models.ImageField(upload_to='project_logo',null=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)


class StaticAnalysis(models.Model):
    class StaticAnalysisType(models.TextChoices):
        LLM         = 'LLM', 'LLM'
        GitLeaks    = 'GitLeaks', 'GitLeaks'
        CVEscan     = 'CVEscan', 'CVEscan'
        Taint       = 'Taint', 'Taint'

    class StaticAnalysisStatus(models.TextChoices):
        Waiting     = 'Waiting', 'Waiting'
        Cloning     = 'Cloning', 'Cloning'
        InProgress  = 'InProgress', 'InProgress'
        Completed   = 'Completed', 'Completed'
        Failed      = 'Failed', 'Failed'

    # static_analysis_id          = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    class SourceType(models.TextChoices):
        GitHub  = 'github', 'GitHub URL'
        Upload  = 'upload', 'Uploaded Archive'

    scan_uuid                   = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, null=True, blank=True)
    user_id                     = models.ForeignKey(User,on_delete=models.CASCADE)
    project                     = models.ForeignKey(Project,on_delete=models.CASCADE)
    static_analysis_type        = models.CharField(max_length=50,choices=StaticAnalysisType.choices, default=StaticAnalysisType.LLM)
    source_type                 = models.CharField(max_length=10, choices=SourceType.choices, default=SourceType.GitHub)
    source_url                  = models.URLField(null=True, blank=True)
    # For dropped-source uploads: a .zip of the project (analyzed instead of cloning).
    source_file                 = models.FileField(upload_to='sast_uploads/', null=True, blank=True)
    LLM_analysis_result         = models.URLField(null=True)
    CVEscan_analysis_result     = models.URLField(null=True)
    GitLeaks_analysis_result    = models.URLField(null=True)
    # Cross-file taint SAST findings, stored inline (works without S3).
    Taint_analysis_result       = models.JSONField(null=True, blank=True)
    repo_folder_name            = models.TextField(default='', blank=True)
    static_analysis_status      = models.CharField(max_length=50, choices=StaticAnalysisStatus.choices, default=StaticAnalysisStatus.Waiting)
    analysis_count              = models.IntegerField(default=0)
    error_message               = models.TextField(default='', blank=True)
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)


class SASTTriage(models.Model):
    """
    Persistent triage decision for a taint finding, keyed by (project, fingerprint).

    The fingerprint is stable across line shifts / file moves / re-scans, so a
    decision made once (false positive, accepted risk, won't fix) survives every
    subsequent scan of the project and suppresses that finding from the active
    count without deleting it — the report stops degrading into noise over time.
    """
    class Status(models.TextChoices):
        Open          = 'open', 'Open'
        FalsePositive = 'false_positive', 'False Positive'
        AcceptedRisk  = 'accepted_risk', 'Accepted Risk'
        WontFix       = 'wont_fix', "Won't Fix"

    project      = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sast_triage')
    fingerprint  = models.CharField(max_length=64, db_index=True)
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.Open)
    note         = models.TextField(default='', blank=True)
    # Snapshot of the finding at triage time (for display / audit).
    cwe          = models.CharField(max_length=20, default='', blank=True)
    sink         = models.CharField(max_length=100, default='', blank=True)
    title        = models.CharField(max_length=255, default='', blank=True)
    triaged_by   = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'fingerprint')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.fingerprint} [{self.status}] ({self.project_id})"


class DynamicAnalysis(models.Model):
    class DynamicAnalysisType(models.TextChoices):
        Nuclei = 'Nuclei', 'Nuclei'
    
    class DynamicAnalysisStatus(models.TextChoices):
        Waiting     = 'Waiting', 'Waiting'
        Cloning     = 'Cloning', 'Cloning'
        InProgress  = 'InProgress', 'InProgress'
        Completed   = 'Completed', 'Completed'
        Failed      = 'Failed', 'Failed'

    # dynamic_analysis_id     = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    scan_uuid               = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, null=True, blank=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    project                 = models.ForeignKey(Project,on_delete=models.CASCADE)
    dynamic_analysis_type   = models.CharField(max_length=50,choices=DynamicAnalysisType.choices, default=DynamicAnalysisType.Nuclei)
    source_url              = models.URLField()
    Nuclei_analysis_result  = models.URLField(null=True)
    dynamic_analysis_status = models.CharField(max_length=50, choices=DynamicAnalysisStatus.choices, default=DynamicAnalysisStatus.Waiting)
    error_message           = models.TextField(default='', blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)


class VulnerabilityAnalysis(models.Model):
    # vulnerability_analysis_id   = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                     = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id             = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_id                  = models.ForeignKey(Project,on_delete=models.CASCADE)
    critical_vulnerabilities    = models.IntegerField(default=0)
    high_vulnerabilities        = models.IntegerField(default=0)
    medium_vulnerabilities      = models.IntegerField(default=0)
    low_vulnerabilities         = models.IntegerField(default=0)
    risk_assessment_matrix      = models.TextField(default='', blank=True)
    vul_trend_by_severity       = models.TextField(default='', blank=True)
    severity_distribution       = models.TextField(default='', blank=True)
    vul_timeline                = models.TextField(default='', blank=True)
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)

class Report(models.Model):
    # report_id               = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    report_uuid             = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, null=True, blank=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    # report_name             = models.CharField(max_length=100)
    # report_type             = models.CharField(max_length=100)
    # report_description      = models.TextField()
    report_url              = models.URLField(null=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

class SecurityPolicy(models.Model):
    # policy_id               = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    policy_name             = models.CharField(max_length=100)
    policy_description      = models.TextField()
    policy_type             = models.CharField(max_length=50, choices=[('Critical','Critical'),('Medium','Medium'),('Low','Low')], default='Low')
    policy_status           = models.CharField(max_length=50, choices=[('Active','Active'),('Inactive','Inactive'),('Under Review','Under Review')], default='Active')
    standard                = models.TextField()
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)


class SecurityAlert(models.Model):
    # alert_id                    = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                     = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id             = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_id                  = models.ForeignKey(Project,on_delete=models.CASCADE)
    alert_type                  = models.CharField(max_length=50)
    alert_short_description     = models.CharField(max_length=180)
    alert_detailed_description  = models.TextField()
    source                      = models.CharField(max_length=100)
    severity                    = models.CharField(max_length=50, choices=[('Critical','Critical'),('High','High'),('Medium','Medium'),('Low','Low')], default='Low')
    alert_assigned_to           = models.ForeignKey(User,on_delete=models.CASCADE, related_name='alert_assigned_to')
    alert_status                = models.CharField(max_length=50, choices=[('Open','Open'),('Investigating','Investigating'),('Resolved','Resolved')], default='Active')
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)


class SupportTicket(models.Model):
    # ticket_id               = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    # user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    ticket_type             = models.CharField(max_length=50)
    ticket_subject          = models.CharField(max_length=180)
    ticket_description      = models.TextField()
    ticket_status           = models.CharField(max_length=50, choices=[('Open','Open'),('In Progress','In Progress'),('Resolved','Resolved')], default='Open')
    created_by              = models.ForeignKey(User,on_delete=models.CASCADE, related_name='created_by')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)


class SupportChat(models.Model):
    # chat_id                 = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    chat_subject            = models.CharField(max_length=180)
    chat_description        = models.TextField()
    chat_content            = models.JSONField(default=dict)
    chat_status             = models.CharField(max_length=50, choices=[('Open','Open'),('In Progress','In Progress'),('Resolved','Resolved')], default='Open')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

class Notification(models.Model):
    # notification_id         = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    notification_type       = models.CharField(max_length=50)
    notification_subject    = models.CharField(max_length=180)
    notification_description = models.TextField()
    notification_status     = models.CharField(max_length=50, choices=[('Open','Open'),('In Progress','In Progress'),('Resolved','Resolved')], default='Open')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

class DashboardAnalytics(models.Model):
    # analytics_id                = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                     = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id             = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    total_vulnerabilities       = models.IntegerField(default=0)
    total_projects              = models.IntegerField(default=0)
    dast_coverage               = models.IntegerField(default=0)
    risk_score                  = models.IntegerField(default=0)
    vulnerability_trend         = models.TextField(default='', blank=True)
    vulnerability_distribution  = models.TextField(default='', blank=True)
    weekly_vulnerability_trend  = models.TextField(default='', blank=True)
    project_security_analysis   = models.TextField(default='', blank=True)
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)


class PricingPlan(models.Model):
    # pricing_id              = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    pricing_plan            = models.CharField(max_length=50)
    pricing_description     = models.TextField()
    pricing_features        = models.JSONField(default=dict)
    pricing_offer           = models.CharField(max_length=50)
    pricing_amount          = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_status          = models.CharField(max_length=50, choices=[('Active','Active'),('Inactive','Inactive')], default='Active')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

class Subscription(models.Model):
    # subscription_id         = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    pricing_id              = models.ForeignKey(PricingPlan,on_delete=models.CASCADE)
    subscription_start_date = models.DateTimeField(auto_now_add=True)
    subscription_end_date   = models.DateTimeField(auto_now=True)
    subscription_status      = models.CharField(max_length=50, choices=[('Active','Active'),('Inactive','Inactive')], default='Active')
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

class Payment(models.Model):
    # payment_id              = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    organization_id         = models.ForeignKey('authenticate.Organization',on_delete=models.CASCADE)
    subscription_id         = models.ForeignKey(Subscription,on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    payment_amount          = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status          = models.CharField(max_length=50, choices=[('Pending','Pending'),('Success','Success'),('Failed','Failed')], default='Pending')
    payment_mode            = models.CharField(max_length=50, choices=[('Card','Card'),('UPI','UPI'),('Net Banking','Net Banking')], default='Card')
    payment_date            = models.DateTimeField(auto_now_add=True)
    payment_expiry          = models.DateTimeField(auto_now=True)

# old testing model
class Testing(models.Model):
    class TestingType(models.TextChoices):
        LLM         = 'LLM', 'LLM'
        GitLeaks    = 'GitLeaks', 'GitLeaks'
        Nuclei      = 'Nuclei', 'Nuclei'
        CVEscan     = 'CVEscan', 'CVEscan'
    
    class TestingStatus(models.TextChoices):
        Waiting = 'Waiting', 'Waiting'
        Cloning = 'Cloning', 'Cloning'
        InProgress = 'InProgress', 'InProgress'
        Completed = 'Completed', 'Completed'
        Failed = 'Failed', 'Failed'

    # test_id                 = models.AutoField(primary_key=True, unique=True, editable=False, db_index=True)
    user_id                 = models.ForeignKey(User,on_delete=models.CASCADE)
    project_id              = models.ForeignKey(Project,on_delete=models.CASCADE)
    testing_type            = models.CharField(max_length=50,choices=TestingType.choices, default=TestingType.LLM)
    source_url              = models.URLField()
    LLM_test_result         = models.URLField(null=True)
    CVEscan_test_result     = models.URLField(null=True)
    GitLeaks_test_result    = models.URLField(null=True)
    Nuclei_test_result      = models.URLField(null=True)
    repo_folder_name        = models.TextField(default='', blank=True)
    testing_status          = models.CharField(max_length=50, choices=TestingStatus.choices, default=TestingStatus.Waiting)
    test_count              = models.IntegerField(default=0)
    error_message           = models.TextField(default='', blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)


class EarlyAccessUser(models.Model):
    email = models.EmailField()
    is_allowed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
    
class ContactForm(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    organization_name = models.CharField(max_length=100)
    message = models.TextField()
    phone_number = models.CharField(max_length=15)
    is_responded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email}"
    
class MobileAppAnalysis(models.Model):
    class MobileAppAnalysisStatus(models.TextChoices):
        Waiting     = 'Waiting', 'Waiting'
        Uploading   = 'Uploading', 'Uploading'
        InProgress  = 'InProgress', 'InProgress'
        Completed   = 'Completed', 'Completed'
        Failed      = 'Failed', 'Failed'
    
    class AppType(models.TextChoices):
        APK = 'APK', 'APK'
        IPA = 'IPA', 'IPA'

    scan_uuid                   = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, null=True, blank=True)
    user_id                     = models.ForeignKey(User, on_delete=models.CASCADE)
    project                     = models.ForeignKey(Project, on_delete=models.CASCADE)
    app_name                    = models.CharField(max_length=255, blank=True, default='')
    app_type                    = models.CharField(max_length=10, choices=AppType.choices, default=AppType.APK)
    app_file                    = models.FileField(upload_to='mobile_apps/')
    file_size                   = models.BigIntegerField(default=0)
    analysis_result             = models.URLField(null=True, blank=True)
    mobile_app_analysis_status  = models.CharField(max_length=50, choices=MobileAppAnalysisStatus.choices, default=MobileAppAnalysisStatus.Waiting)
    total_vulnerabilities       = models.IntegerField(default=0)
    critical_count              = models.IntegerField(default=0)
    high_count                  = models.IntegerField(default=0)
    medium_count                = models.IntegerField(default=0)
    low_count                   = models.IntegerField(default=0)
    error_message               = models.TextField(default='', blank=True)
    created_at                  = models.DateTimeField(auto_now_add=True)
    updated_at                  = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Mobile App Analysis'
        verbose_name_plural = 'Mobile App Analyses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.app_name} - {self.project.project_name}"


class BrowserExtensionAnalysis(models.Model):
    """
    Model for storing browser extension security analysis results.
    Supports Chrome (.crx), Firefox (.xpi), Safari (.safariextz), and generic (.zip) extensions.
    """
    class BrowserExtensionAnalysisStatus(models.TextChoices):
        Waiting     = 'Waiting', 'Waiting'
        Uploading   = 'Uploading', 'Uploading'
        Extracting  = 'Extracting', 'Extracting'
        InProgress  = 'InProgress', 'InProgress'
        Completed   = 'Completed', 'Completed'
        Failed      = 'Failed', 'Failed'
    
    class ExtensionType(models.TextChoices):
        CRX         = 'CRX', 'Chrome Extension (.crx)'
        XPI         = 'XPI', 'Firefox Extension (.xpi)'
        SAFARIEXTZ  = 'SAFARIEXTZ', 'Safari Extension (.safariextz)'
        ZIP         = 'ZIP', 'Generic Extension (.zip)'

    scan_uuid                           = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, null=True, blank=True)
    user_id                             = models.ForeignKey(User, on_delete=models.CASCADE)
    project                             = models.ForeignKey(Project, on_delete=models.CASCADE)
    extension_name                      = models.CharField(max_length=255, blank=True, default='')
    extension_version                   = models.CharField(max_length=50, blank=True, default='')
    extension_type                      = models.CharField(max_length=15, choices=ExtensionType.choices, default=ExtensionType.CRX)
    extension_file                      = models.FileField(upload_to='browser_extensions/')
    file_size                           = models.BigIntegerField(default=0)
    manifest_version                    = models.IntegerField(null=True, blank=True)
    permissions                         = models.JSONField(default=list, blank=True)
    analysis_result                     = models.URLField(null=True, blank=True)
    browser_extension_analysis_status   = models.CharField(max_length=50, choices=BrowserExtensionAnalysisStatus.choices, default=BrowserExtensionAnalysisStatus.Waiting)
    total_vulnerabilities               = models.IntegerField(default=0)
    code_vulnerabilities                = models.IntegerField(default=0)
    permission_issues                   = models.IntegerField(default=0)
    critical_count                      = models.IntegerField(default=0)
    high_count                          = models.IntegerField(default=0)
    medium_count                        = models.IntegerField(default=0)
    low_count                           = models.IntegerField(default=0)
    risk_score                          = models.IntegerField(default=0)
    error_message                       = models.TextField(default='', blank=True)
    created_at                          = models.DateTimeField(auto_now_add=True)
    updated_at                          = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Browser Extension Analysis'
        verbose_name_plural = 'Browser Extension Analyses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.extension_name} - {self.project.project_name}"


class SCAAnalysis(models.Model):
    """
    Software Composition Analysis: scans a GitHub repo's dependency manifests
    (requirements.txt / package.json / pom.xml / Dockerfile) for known CVEs via
    OSV/NVD, plus a light regex SAST pass. Core logic lives in
    api/helpers/sca_core.py; the scan runs in SCAScanTask.
    """
    class SCAAnalysisStatus(models.TextChoices):
        Waiting     = 'Waiting', 'Waiting'
        Cloning     = 'Cloning', 'Cloning'
        Extracting  = 'Extracting', 'Extracting'
        InProgress  = 'InProgress', 'InProgress'
        Completed   = 'Completed', 'Completed'
        Failed      = 'Failed', 'Failed'

    class SCASourceType(models.TextChoices):
        GitHub  = 'github', 'GitHub URL'
        Upload  = 'upload', 'Uploaded Archive'

    scan_uuid               = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, null=True, blank=True)
    user_id                 = models.ForeignKey(User, on_delete=models.CASCADE)
    project                 = models.ForeignKey(Project, on_delete=models.CASCADE)
    source_type             = models.CharField(max_length=10, choices=SCASourceType.choices, default=SCASourceType.GitHub)
    source_url              = models.URLField(null=True, blank=True)
    # For local-repo uploads: a .zip of the project (parsed instead of cloning).
    source_file             = models.FileField(upload_to='sca_uploads/', null=True, blank=True)
    sca_analysis_status     = models.CharField(max_length=50, choices=SCAAnalysisStatus.choices, default=SCAAnalysisStatus.Waiting)
    # Full result payload from SoftwareCompositionAnalyzer.scan_project(); stored
    # inline so the feature works without S3/R2 (mirrors how recon degrades).
    analysis_result         = models.JSONField(null=True, blank=True)
    total_dependencies      = models.IntegerField(default=0)
    total_vulnerabilities   = models.IntegerField(default=0)
    code_vulnerabilities    = models.IntegerField(default=0)
    critical_count          = models.IntegerField(default=0)
    high_count              = models.IntegerField(default=0)
    medium_count            = models.IntegerField(default=0)
    low_count               = models.IntegerField(default=0)
    error_message           = models.TextField(default='', blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'SCA Analysis'
        verbose_name_plural = 'SCA Analyses'
        ordering = ['-created_at']

    def __str__(self):
        return f"SCA {self.scan_uuid} - {self.project.project_name}"