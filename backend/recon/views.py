"""
DRF API for the recon framework.

Endpoints (under /recon/):
  POST /recon/scan/                start a domain pipeline run        {target, options}
  GET  /recon/scan/                list current user's runs
  GET  /recon/scan/<uuid>/         run detail (steps + rollups)
  GET  /recon/scan/<uuid>/findings/  findings for a run (filter ?kind= &severity=)
  POST /recon/module/              run an on-demand module            {scan_type, target, options}
  GET  /recon/tools/               tool availability report
  POST /recon/ai/                  free-form AI analysis              {prompt}
  POST /recon/brain/<uuid>/        (re)generate AI summary for a run
"""
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.authentication import JWTAuthentication

from recon.models import ScanRun, Finding, ScanType
from recon.serializers import (
    ScanRunSerializer, ScanRunListSerializer, FindingSerializer,
)
from recon import tasks as recon_tasks
from recon.tools.base import availability_report

logger = logging.getLogger('recon')


def _enqueue(task, run, *args):
    """
    Enqueue a Celery task for a run. If the broker is unreachable (common in
    local dev without Redis), fall back to running the task eagerly in-process
    so the feature still works end-to-end instead of 500-ing and leaving an
    orphaned 'queued' run.
    """
    try:
        task.delay(run.id, *args)
        return 'queued'
    except Exception as e:  # noqa: BLE001 — broker down / connection refused
        logger.warning("broker unavailable (%s); running %s eagerly", e, task.name)
        try:
            task.apply(args=(run.id, *args))  # synchronous, same code path
            return 'eager'
        except Exception as run_err:  # noqa: BLE001
            logger.exception("eager execution of %s failed", task.name)
            run.status = 'failed'
            run.error_message = f"failed to start: {run_err}"
            run.save(update_fields=['status', 'error_message', 'updated_at'])
            return 'failed'


class StartScanAPIView(APIView):
    """Start a full 12-step domain pipeline, and list runs."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = ScanRun.objects.filter(user=request.user, scan_type=ScanType.DOMAIN)
        return Response(ScanRunListSerializer(runs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        target = request.data.get('target')
        if not target:
            return Response({'message': 'target is required'}, status=status.HTTP_400_BAD_REQUEST)
        options = request.data.get('options') or {}
        run = ScanRun.objects.create(
            user=request.user, scan_type=ScanType.DOMAIN,
            target=str(target).strip(), options=options,
        )
        _enqueue(recon_tasks.run_domain_pipeline, run)
        run.refresh_from_db()
        return Response(ScanRunSerializer(run).data, status=status.HTTP_201_CREATED)


class ScanDetailAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, run_uuid):
        try:
            run = ScanRun.objects.get(run_uuid=run_uuid, user=request.user)
        except ScanRun.DoesNotExist:
            return Response({'message': 'run not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ScanRunSerializer(run).data, status=status.HTTP_200_OK)

    def delete(self, request, run_uuid):
        try:
            run = ScanRun.objects.get(run_uuid=run_uuid, user=request.user)
        except ScanRun.DoesNotExist:
            return Response({'message': 'run not found'}, status=status.HTTP_404_NOT_FOUND)
        run.delete()
        return Response({'message': 'deleted'}, status=status.HTTP_200_OK)


class ScanFindingsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, run_uuid):
        try:
            run = ScanRun.objects.get(run_uuid=run_uuid, user=request.user)
        except ScanRun.DoesNotExist:
            return Response({'message': 'run not found'}, status=status.HTTP_404_NOT_FOUND)
        qs = Finding.objects.filter(run=run)
        kind = request.query_params.get('kind')
        severity = request.query_params.get('severity')
        if kind:
            qs = qs.filter(kind=kind)
        if severity:
            qs = qs.filter(severity=severity)
        return Response(FindingSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class RunModuleAPIView(APIView):
    """Run an on-demand module (xss, sqli, fuzz, jwt, github, mobile, aem, depconf, api)."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    VALID = {'xss', 'sqli', 'fuzz', 'jwt', 'github', 'mobile', 'aem', 'depconf', 'api'}

    def post(self, request):
        scan_type = request.data.get('scan_type')
        target = request.data.get('target')
        if scan_type not in self.VALID:
            return Response({'message': f'scan_type must be one of {sorted(self.VALID)}'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not target:
            return Response({'message': 'target is required'}, status=status.HTTP_400_BAD_REQUEST)
        run = ScanRun.objects.create(
            user=request.user, scan_type=scan_type,
            target=str(target).strip(), options=request.data.get('options') or {},
        )
        _enqueue(recon_tasks.run_ondemand_module, run)
        run.refresh_from_db()
        return Response(ScanRunSerializer(run).data, status=status.HTTP_201_CREATED)


class ApiScanAPIView(APIView):
    """
    Start an authenticated API security scan (OWASP API Top 10).

    Accepts either:
      * multipart with a dropped `file` = a Postman collection or OpenAPI/Swagger
        spec (.json), plus form fields for target/auth, OR
      * a JSON body:
        {
          "target": "<base url or spec url>",              # required
          "options": {
             "openapi_url" | "postman_collection": ...,     # or inline dict
             "endpoints": [ ... ],
             "headers": {..}, "auth_token": "..", "cookie": "..",
             "second_headers"|"second_auth_token"|"second_cookie": ..,  # low-priv identity
             "authorize_load_test": false,
             "base_url": ".."
          }
        }
    Wraps the same `api` on-demand module (ApiSecurityScanner) so results land in
    ScanRun/Finding exactly like every other module.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        import json as _json
        data = request.data
        options = data.get('options') or {}
        if isinstance(options, str):
            try:
                options = _json.loads(options)
            except ValueError:
                options = {}

        target = (data.get('target') or options.get('base_url') or '').strip()

        # A dropped Postman/OpenAPI file — parse and route into options.
        upload = request.FILES.get('file') or request.FILES.get('postman_collection')
        if upload:
            try:
                doc = _json.loads(upload.read().decode('utf-8', errors='ignore'))
            except ValueError:
                return Response({'message': 'uploaded file is not valid JSON (Postman/OpenAPI)'},
                                status=status.HTTP_400_BAD_REQUEST)
            if isinstance(doc, dict) and ('item' in doc and 'info' in doc):
                options['postman_collection'] = doc        # Postman v2.x
            else:
                options['openapi'] = doc                    # OpenAPI/Swagger
            # Best-effort target from the spec if none supplied.
            if not target:
                servers = (doc.get('servers') if isinstance(doc, dict) else None) or []
                if servers and servers[0].get('url'):
                    target = servers[0]['url']

        if not target and not (options.get('endpoints') or options.get('postman_collection')
                               or options.get('openapi') or options.get('openapi_url')):
            return Response({'message': 'provide a target URL, an uploaded Postman/OpenAPI '
                                        'file, or options.endpoints'},
                            status=status.HTTP_400_BAD_REQUEST)

        run = ScanRun.objects.create(
            user=request.user, scan_type=ScanType.API,
            target=str(target or 'api-scan')[:500], options=options,
        )
        _enqueue(recon_tasks.run_ondemand_module, run)
        run.refresh_from_db()
        return Response(ScanRunSerializer(run).data, status=status.HTTP_201_CREATED)


class ToolsStatusAPIView(APIView):
    """Report which underlying CLI tools are installed/available."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report = availability_report()
        return Response({
            'tools': report,
            'available': sorted([k for k, v in report.items() if v]),
            'missing': sorted([k for k, v in report.items() if not v]),
        }, status=status.HTTP_200_OK)


class AiAnalysisAPIView(APIView):
    """/ai — free-form AI analysis prompt (OpenRouter primary, Gemini fallback)."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'message': 'prompt is required'}, status=status.HTTP_400_BAD_REQUEST)
        from recon.ai.client import call_ai
        try:
            answer = call_ai(prompt, system=request.data.get('system'))
            return Response({'answer': answer}, status=status.HTTP_200_OK)
        except Exception as e:  # noqa: BLE001
            return Response({'message': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class BrainAPIView(APIView):
    """/brain — (re)generate the AI summary for a finished run."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, run_uuid):
        try:
            run = ScanRun.objects.get(run_uuid=run_uuid, user=request.user)
        except ScanRun.DoesNotExist:
            return Response({'message': 'run not found'}, status=status.HTTP_404_NOT_FOUND)
        mode = _enqueue(recon_tasks.generate_run_summary, run)
        return Response({'message': f'summary generation {mode}', 'run_uuid': str(run.run_uuid)},
                        status=status.HTTP_202_ACCEPTED)
