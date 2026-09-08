"""
Persistence for recon runs.

  ScanRun     -> one domain run (the 12-step pipeline) or an on-demand module run
  StepResult  -> per-step status, counts, R2 link, timing
  Finding     -> normalized records (subdomain/port/vuln/secret/takeover/...)

These are intentionally generic so every pipeline step and on-demand module can
persist into the same tables and the dashboard/AI layer can query uniformly.
"""
import uuid

from django.db import models

from authenticate.models import User


class ScanType(models.TextChoices):
    DOMAIN = 'domain', 'Domain Pipeline'          # the full 12-step run
    XSS = 'xss', 'XSS (dalfox)'
    SQLI = 'sqli', 'SQL Injection (sqlmap)'
    FUZZ = 'fuzz', 'Fuzzing (ffuf)'
    JWT = 'jwt', 'JWT Analysis'
    GITHUB = 'github', 'GitHub Recon'
    MOBILE = 'mobile', 'Mobile App (MobSF)'
    AEM = 'aem', 'Adobe AEM'
    DEPCONF = 'depconf', 'Dependency Confusion'
    API = 'api', 'API Security (OWASP API Top 10)'
    MONITOR = 'monitor', 'Monitoring Daemon'


class RunStatus(models.TextChoices):
    QUEUED = 'queued', 'Queued'
    RUNNING = 'running', 'Running'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    PARTIAL = 'partial', 'Partial (some steps skipped/failed)'


class StepStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    RUNNING = 'running', 'Running'
    SUCCESS = 'success', 'Success'
    EMPTY = 'empty', 'Empty'
    SKIPPED = 'skipped', 'Skipped (tool missing/disabled)'
    FAILED = 'failed', 'Failed'


class Severity(models.TextChoices):
    CRITICAL = 'critical', 'Critical'
    HIGH = 'high', 'High'
    MEDIUM = 'medium', 'Medium'
    LOW = 'low', 'Low'
    INFO = 'info', 'Info'
    UNKNOWN = 'unknown', 'Unknown'


class ScanRun(models.Model):
    run_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scan_runs', null=True, blank=True)
    scan_type = models.CharField(max_length=20, choices=ScanType.choices, default=ScanType.DOMAIN)
    target = models.CharField(max_length=500, help_text='Domain, URL, repo, or file identifier')
    status = models.CharField(max_length=20, choices=RunStatus.choices, default=RunStatus.QUEUED)

    # Free-form options passed to the pipeline/module (rate limits, modes, flags).
    options = models.JSONField(default=dict, blank=True)

    # Rollup counts for quick dashboard reads.
    total_findings = models.IntegerField(default=0)
    critical_count = models.IntegerField(default=0)
    high_count = models.IntegerField(default=0)
    medium_count = models.IntegerField(default=0)
    low_count = models.IntegerField(default=0)
    info_count = models.IntegerField(default=0)

    summary = models.TextField(default='', blank=True, help_text='AI/auto-generated summary')
    summary_url = models.URLField(null=True, blank=True, help_text='R2 link to full summary report')
    error_message = models.TextField(default='', blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.scan_type}:{self.target} [{self.status}]"

    def recount(self):
        """Recompute rollup counts from related findings."""
        qs = self.findings.all()
        self.total_findings = qs.count()
        self.critical_count = qs.filter(severity=Severity.CRITICAL).count()
        self.high_count = qs.filter(severity=Severity.HIGH).count()
        self.medium_count = qs.filter(severity=Severity.MEDIUM).count()
        self.low_count = qs.filter(severity=Severity.LOW).count()
        self.info_count = qs.filter(severity=Severity.INFO).count()
        self.save(update_fields=['total_findings', 'critical_count', 'high_count',
                                 'medium_count', 'low_count', 'info_count', 'updated_at'])


class StepResult(models.Model):
    run = models.ForeignKey(ScanRun, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField(default=0)
    step_key = models.CharField(max_length=64)           # e.g. 'subdomain_enum'
    tool = models.CharField(max_length=64, default='')   # e.g. 'subfinder'
    status = models.CharField(max_length=20, choices=StepStatus.choices, default=StepStatus.PENDING)
    record_count = models.IntegerField(default=0)
    output_url = models.URLField(null=True, blank=True)  # R2 link to the artifact
    output_s3_uri = models.CharField(max_length=500, default='', blank=True)
    command = models.TextField(default='', blank=True)
    duration_s = models.FloatField(default=0.0)
    error_message = models.TextField(default='', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['run', 'step_number']

    def __str__(self):
        return f"#{self.step_number} {self.step_key} ({self.status})"


class Finding(models.Model):
    class Kind(models.TextChoices):
        SUBDOMAIN = 'subdomain', 'Subdomain'
        LIVE_HOST = 'live_host', 'Live Host'
        PORT = 'port', 'Open Port'
        TECH = 'tech', 'Technology'
        TAKEOVER = 'takeover', 'DNS Takeover'
        S3_BUCKET = 's3_bucket', 'S3 Bucket'
        VULNERABILITY = 'vulnerability', 'Vulnerability'
        SECRET = 'secret', 'Secret/Token'
        URL = 'url', 'URL'
        GF_MATCH = 'gf_match', 'GF Pattern Match'
        BACKUP_FILE = 'backup_file', 'Backup File'
        MISCONFIG = 'misconfig', 'Misconfiguration'
        API_ENDPOINT = 'api_endpoint', 'API Endpoint'
        API_VULN = 'api_vuln', 'API Vulnerability'
        OTHER = 'other', 'Other'

    run = models.ForeignKey(ScanRun, on_delete=models.CASCADE, related_name='findings')
    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.OTHER)
    severity = models.CharField(max_length=12, choices=Severity.choices, default=Severity.INFO)
    title = models.CharField(max_length=300, default='')
    host = models.CharField(max_length=300, default='', blank=True, db_index=True)
    url = models.URLField(max_length=1000, null=True, blank=True)
    tool = models.CharField(max_length=64, default='', blank=True)
    # Full raw record from the tool, so nothing is lost.
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-severity', 'kind']
        indexes = [
            models.Index(fields=['run', 'kind']),
            models.Index(fields=['run', 'severity']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.kind}: {self.title or self.host}"
