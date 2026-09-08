"""
Celery orchestration for recon.

`run_domain_pipeline` executes the 12 steps in order against a ScanRun, persisting
a StepResult per step, normalized Findings, and uploading every non-empty artifact
to R2 as it's produced. On-demand modules get their own thin tasks.
"""
from __future__ import annotations

import logging
import os

from celery import shared_task
from django.utils import timezone

from recon.models import ScanRun, StepResult, Finding, RunStatus, StepStatus, Severity
from recon.pipeline import PipelineContext, pipeline_steps
from recon.storage import ReconStorage
from recon import constants
from recon.tools.base import get_tool, ToolStatus

logger = logging.getLogger('recon')


def _persist_findings(run: ScanRun, findings):
    """Bulk-create Finding rows from normalized dicts."""
    objs = []
    for f in findings:
        sev = f.get('severity', 'info')
        if sev not in Severity.values:
            sev = 'unknown'
        objs.append(Finding(
            run=run,
            kind=f.get('kind', 'other'),
            severity=sev,
            title=(f.get('title') or '')[:300],
            host=(f.get('host') or '')[:300],
            url=f.get('url') or None,
            tool=(f.get('tool') or '')[:64],
            data=f.get('data', {}) or {},
        ))
    if objs:
        Finding.objects.bulk_create(objs, batch_size=500)


@shared_task(bind=True)
def run_domain_pipeline(self, run_id: int):
    """Run the full 12-step domain pipeline for a ScanRun id."""
    try:
        run = ScanRun.objects.get(pk=run_id)
    except ScanRun.DoesNotExist:
        logger.error("ScanRun %s not found", run_id)
        return f"ScanRun {run_id} not found"

    run.status = RunStatus.RUNNING
    run.started_at = timezone.now()
    run.save(update_fields=['status', 'started_at', 'updated_at'])

    storage = ReconStorage(run_uuid=str(run.run_uuid))
    ctx = PipelineContext(run_uuid=str(run.run_uuid), target=run.target,
                          options=run.options or {}, storage=storage)

    any_success = False
    any_failure = False

    for step_cls in pipeline_steps():
        step = step_cls(ctx)
        sr = StepResult.objects.create(
            run=run, step_number=step_cls.number, step_key=step_cls.key,
            status=StepStatus.RUNNING,
        )
        logger.info("[run %s] step %d %s starting", run.run_uuid, step_cls.number, step_cls.key)
        try:
            outcome = step.run()
        except Exception as e:  # noqa: BLE001
            logger.exception("[run %s] step %s crashed", run.run_uuid, step_cls.key)
            sr.status = StepStatus.FAILED
            sr.error_message = str(e)
            sr.save()
            any_failure = True
            continue

        # Map outcome status onto StepStatus.
        status_map = {
            'success': StepStatus.SUCCESS, 'empty': StepStatus.EMPTY,
            'skipped': StepStatus.SKIPPED, 'failed': StepStatus.FAILED,
        }
        sr.status = status_map.get(outcome.status, StepStatus.FAILED)
        sr.tool = outcome.tool or ''
        sr.record_count = len(outcome.records)
        sr.command = (outcome.command or '')[:4000]
        sr.duration_s = outcome.duration_s
        sr.error_message = outcome.error or ''

        # Upload artifact to R2 (non-empty only).
        if outcome.artifact_path and os.path.exists(outcome.artifact_path):
            up = storage.upload_file(outcome.artifact_path,
                                     name=outcome.artifact_name or os.path.basename(outcome.artifact_path))
            if up.get('success'):
                sr.output_url = up.get('public_url')
                sr.output_s3_uri = up.get('s3_uri') or ''
            # tidy temp file
            try:
                os.remove(outcome.artifact_path)
            except OSError:
                pass
        sr.save()

        # Persist findings.
        _persist_findings(run, outcome.findings)

        if sr.status == StepStatus.SUCCESS:
            any_success = True
        elif sr.status == StepStatus.FAILED:
            any_failure = True

    # Finalize run.
    run.refresh_from_db()
    run.recount()
    if any_success and any_failure:
        run.status = RunStatus.PARTIAL
    elif any_success:
        run.status = RunStatus.COMPLETED
    else:
        run.status = RunStatus.PARTIAL if not any_failure else RunStatus.FAILED
    run.finished_at = timezone.now()
    run.save(update_fields=['status', 'finished_at', 'updated_at'])

    # Optional AI summary (/brain auto-run).
    if run.options.get('ai_summary'):
        try:
            generate_run_summary.delay(run.id)
        except Exception:  # noqa: BLE001
            logger.warning("could not enqueue AI summary")

    logger.info("[run %s] pipeline finished: %s (%d findings)",
                run.run_uuid, run.status, run.total_findings)
    return f"Domain pipeline {run.status} for {run.target} — {run.total_findings} findings"


@shared_task(bind=True)
def generate_run_summary(self, run_id: int):
    """/brain — AI-summarize a finished run's findings and store to R2."""
    from recon.ai.client import summarize_findings
    try:
        run = ScanRun.objects.get(pk=run_id)
    except ScanRun.DoesNotExist:
        return f"ScanRun {run_id} not found"
    findings = list(run.findings.values('kind', 'severity', 'title', 'host', 'url', 'tool')[:1000])
    summary = summarize_findings(run.target, findings)
    run.summary = summary
    storage = ReconStorage(run_uuid=str(run.run_uuid))
    up = storage.upload_text(summary, 'summary.md', skip_empty=False)
    if up.get('success'):
        run.summary_url = up.get('public_url')
    run.save(update_fields=['summary', 'summary_url', 'updated_at'])
    return f"Summary generated for {run.target}"


# --------------------------------------------------------------------------- #
# On-demand single-tool modules (run outside the main domain pipeline).
# --------------------------------------------------------------------------- #
_ONDEMAND_TOOL_KEYS = {
    'xss': constants.DALFOX,
    'sqli': constants.SQLMAP,
    'fuzz': constants.FFUF,
    'jwt': constants.JWT_TOOL,
    'github': constants.GITLEAKS,
    'mobile': constants.MOBSF,
    'aem': constants.AEM,
    'depconf': constants.DEP_CONFUSION,
    'api': constants.API_SCANNER,
}


@shared_task(bind=True)
def run_ondemand_module(self, run_id: int):
    """Run a single on-demand module identified by ScanRun.scan_type."""
    try:
        run = ScanRun.objects.get(pk=run_id)
    except ScanRun.DoesNotExist:
        return f"ScanRun {run_id} not found"

    tool_key = _ONDEMAND_TOOL_KEYS.get(run.scan_type)
    if not tool_key:
        run.status = RunStatus.FAILED
        run.error_message = f"no module for scan_type '{run.scan_type}'"
        run.save()
        return run.error_message

    run.status = RunStatus.RUNNING
    run.started_at = timezone.now()
    run.save(update_fields=['status', 'started_at', 'updated_at'])

    tool = get_tool(tool_key)
    sr = StepResult.objects.create(run=run, step_number=1, step_key=run.scan_type,
                                   tool=tool_key, status=StepStatus.RUNNING)
    storage = ReconStorage(run_uuid=str(run.run_uuid))

    try:
        res = tool.run(run.target, **(run.options or {}))
    except Exception as e:  # noqa: BLE001
        sr.status = StepStatus.FAILED
        sr.error_message = str(e)
        sr.save()
        run.status = RunStatus.FAILED
        run.error_message = str(e)
        run.save()
        return f"module {run.scan_type} failed: {e}"

    status_map = {ToolStatus.SUCCESS: StepStatus.SUCCESS, ToolStatus.EMPTY: StepStatus.EMPTY,
                  ToolStatus.SKIPPED: StepStatus.SKIPPED, ToolStatus.FAILED: StepStatus.FAILED,
                  ToolStatus.TIMEOUT: StepStatus.FAILED}
    sr.status = status_map.get(res.status, StepStatus.FAILED)
    sr.record_count = len(res.parsed)
    sr.command = (res.command or '')[:4000]
    sr.duration_s = res.duration_s
    sr.error_message = res.error or ''
    sr.save()

    # Normalize findings generically. A tool may supply its own 'kind' (e.g. the
    # API scanner emits 'api_endpoint'/'api_vuln'); honour it, else default to
    # 'vulnerability'.
    findings = []
    for r in res.parsed:
        findings.append({
            'kind': r.get('kind') or 'vulnerability',
            'severity': r.get('severity', 'info'),
            'title': (r.get('title') or r.get('issue') or r.get('type') or run.scan_type)[:300],
            'host': r.get('host', run.target),
            'url': r.get('url'),
            'tool': tool_key,
            'data': r,
        })
    _persist_findings(run, findings)

    # Store raw results to R2.
    up = storage.upload_json(res.parsed, f"{run.scan_type}-results.json")
    if up.get('success'):
        sr.output_url = up.get('public_url')
        sr.output_s3_uri = up.get('s3_uri') or ''
        sr.save(update_fields=['output_url', 'output_s3_uri'])

    run.refresh_from_db()
    run.recount()
    run.status = RunStatus.COMPLETED if res.ok else RunStatus.FAILED
    run.finished_at = timezone.now()
    run.save(update_fields=['status', 'finished_at', 'updated_at'])
    return f"module {run.scan_type} {run.status} — {run.total_findings} findings"
