from django.contrib import admin

from recon.models import ScanRun, StepResult, Finding


class StepResultInline(admin.TabularInline):
    model = StepResult
    extra = 0
    readonly_fields = ['step_number', 'step_key', 'tool', 'status', 'record_count',
                       'output_url', 'duration_s', 'error_message']


@admin.register(ScanRun)
class ScanRunAdmin(admin.ModelAdmin):
    list_display = ['run_uuid', 'scan_type', 'target', 'status', 'total_findings',
                    'critical_count', 'high_count', 'created_at']
    list_filter = ['scan_type', 'status', 'created_at']
    search_fields = ['target', 'run_uuid']
    readonly_fields = ['run_uuid', 'created_at', 'updated_at', 'started_at', 'finished_at']
    inlines = [StepResultInline]


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ['kind', 'severity', 'title', 'host', 'tool', 'created_at']
    list_filter = ['kind', 'severity', 'tool']
    search_fields = ['title', 'host', 'url']


@admin.register(StepResult)
class StepResultAdmin(admin.ModelAdmin):
    list_display = ['run', 'step_number', 'step_key', 'tool', 'status', 'record_count', 'duration_s']
    list_filter = ['status', 'step_key']
