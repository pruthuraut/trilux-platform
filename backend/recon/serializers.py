from rest_framework import serializers

from recon.models import ScanRun, StepResult, Finding


class FindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finding
        fields = ['id', 'kind', 'severity', 'title', 'host', 'url', 'tool', 'data', 'created_at']


class StepResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepResult
        fields = ['step_number', 'step_key', 'tool', 'status', 'record_count',
                  'output_url', 'output_s3_uri', 'duration_s', 'error_message', 'created_at']


class ScanRunSerializer(serializers.ModelSerializer):
    steps = StepResultSerializer(many=True, read_only=True)

    class Meta:
        model = ScanRun
        fields = ['id', 'run_uuid', 'scan_type', 'target', 'status', 'options',
                  'total_findings', 'critical_count', 'high_count', 'medium_count',
                  'low_count', 'info_count', 'summary', 'summary_url', 'error_message',
                  'started_at', 'finished_at', 'created_at', 'updated_at', 'steps']
        read_only_fields = ['run_uuid', 'status', 'total_findings', 'critical_count',
                            'high_count', 'medium_count', 'low_count', 'info_count',
                            'summary', 'summary_url', 'error_message', 'started_at',
                            'finished_at', 'steps']


class ScanRunListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanRun
        fields = ['id', 'run_uuid', 'scan_type', 'target', 'status',
                  'total_findings', 'critical_count', 'high_count',
                  'created_at', 'finished_at']
