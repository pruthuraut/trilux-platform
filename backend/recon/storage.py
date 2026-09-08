"""
R2/S3 result storage for recon runs.

Thin convenience layer over the existing `helpers.s3_helper.S3Helper` so the
pipeline can do "upload this output file if non-empty" in one call and get back
a public URL to persist on the model.

Per the spec: *every non-empty output file is uploaded to Cloudflare R2 as it's
written.*
"""
from __future__ import annotations

import logging
import os
from io import BytesIO
from typing import Any, Dict, Optional

from helpers.s3_helper import S3Helper
from trilux.config import Config as config

logger = logging.getLogger('recon')

# Bucket dedicated to recon artifacts; falls back to the generic report bucket.
RECON_BUCKET = os.getenv('RECON_BUCKET') or getattr(config, 'GITHUB_REPO_REPORT_BUCKET', None) or 'recon-results'


class ReconStorage:
    """Uploads recon artifacts to R2 under a per-run prefix."""

    def __init__(self, run_uuid: str, bucket_name: Optional[str] = None):
        self.run_uuid = str(run_uuid)
        self.bucket_name = bucket_name or RECON_BUCKET
        # Lazy: don't build the S3 client until first use, and tolerate an
        # unconfigured/invalid R2 setup (local dev) by disabling uploads instead
        # of crashing the whole pipeline. Findings still persist to the DB.
        self._s3 = None
        self._disabled = False

    @property
    def s3(self):
        if self._s3 is None and not self._disabled:
            try:
                self._s3 = S3Helper(bucket_name=self.bucket_name)
            except Exception as e:  # noqa: BLE001 — missing/invalid R2 creds
                logger.warning("[storage] R2 unavailable, uploads disabled: %s", e)
                self._disabled = True
        return self._s3

    def _key(self, name: str) -> str:
        return f"recon/{self.run_uuid}/{name}"

    def upload_file(self, local_path: str, name: Optional[str] = None,
                    skip_empty: bool = True) -> Dict[str, Any]:
        """
        Upload a local file to R2. Returns the S3Helper result dict augmented with
        's3_uri'. Empty files are skipped by default (per the 'non-empty' rule).
        """
        if not local_path or not os.path.exists(local_path):
            return {'success': False, 'message': f'file not found: {local_path}', 'public_url': None}

        if skip_empty and os.path.getsize(local_path) == 0:
            logger.info("[storage] skipping empty file %s", local_path)
            return {'success': False, 'message': 'empty file skipped', 'skipped': True, 'public_url': None}

        if self.s3 is None:
            return {'success': False, 'message': 'R2 not configured; upload skipped',
                    'skipped': True, 'public_url': None}

        key = self._key(name or os.path.basename(local_path))
        result = self.s3.upload_file(local_path, object_name=key)
        result['s3_uri'] = f"s3://{self.bucket_name}/{key}" if result.get('success') else None
        if result.get('success'):
            logger.info("[storage] uploaded %s -> %s", local_path, result['s3_uri'])
        else:
            logger.warning("[storage] upload failed for %s: %s", local_path, result.get('message'))
        return result

    def upload_text(self, content: str, name: str, skip_empty: bool = True) -> Dict[str, Any]:
        """Upload an in-memory string as an object."""
        if skip_empty and not content.strip():
            return {'success': False, 'message': 'empty content skipped', 'skipped': True, 'public_url': None}
        if self.s3 is None:
            return {'success': False, 'message': 'R2 not configured; upload skipped',
                    'skipped': True, 'public_url': None}
        key = self._key(name)
        buf = BytesIO(content.encode('utf-8'))
        result = self.s3.upload_file_obj(buf, object_name=key)
        result['s3_uri'] = f"s3://{self.bucket_name}/{key}" if result.get('success') else None
        return result

    def upload_json(self, data: Any, name: str) -> Dict[str, Any]:
        import json
        return self.upload_text(json.dumps(data, indent=2, default=str), name, skip_empty=False)
