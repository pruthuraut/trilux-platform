"""
Extra scanner wrappers that don't fit the plain CLI-binary mould.

  - GitleaksTool (constants.GITLEAKS): a normal CLI wrapper around the `gitleaks`
    binary, scanning a local directory and parsing its JSON report.
  - MobSFTool   (constants.MOBSF): MobSF runs as an HTTP service rather than a
    CLI, so this is a pure-Python client that uploads a mobile app binary to the
    MobSF REST API, triggers a scan, and parses the JSON report. Availability is
    gated on the MOBSF_URL / MOBSF_API_KEY environment variables.
"""
from __future__ import annotations

import json
import os
import re  # noqa: F401  (kept for parity with custom.py import contract)
import socket  # noqa: F401
import time
from typing import Any, Dict, List

import requests

from recon import constants
from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon.tools.util import normalize_severity, strip_scheme  # noqa: F401


@register_tool(constants.GITLEAKS)
class GitleaksTool(BaseTool):
    """Wrapper around the `gitleaks` secret scanner (local directory scan)."""

    name = 'gitleaks'
    binary = 'gitleaks'
    # gitleaks exits 1 when leaks are found — that is a successful run for us.
    acceptable_returncodes = (0, 1)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._report_path = ''

    def build_command(self, target: str, **kwargs) -> List[str]:
        path = kwargs.get('path', target)
        self._report_path = self.scratch_file('.json')
        return [
            self.binary, 'dir', path,
            '-f', 'json',
            '-r', self._report_path,
            '--no-banner',
        ]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        records: List[Dict[str, Any]] = []
        path = self._report_path
        if not path or not os.path.exists(path):
            return records
        result.output_files.append(path)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().strip()
            if not content:
                return records
            data = json.loads(content)
        except (OSError, json.JSONDecodeError):
            return records
        if not isinstance(data, list):
            return records
        for rec in data:
            if not isinstance(rec, dict):
                continue
            records.append({
                'rule': rec.get('RuleID'),
                'file': rec.get('File'),
                'secret': rec.get('Secret'),
                'line': rec.get('StartLine'),
                'severity': normalize_severity('high'),
            })
        return records


@register_tool(constants.MOBSF)
class MobSFTool(BaseTool):
    """Pure-Python client for the MobSF static-analysis REST API."""

    name = 'mobsf'
    binary = ''

    @staticmethod
    def _base_url() -> str:
        return os.getenv('MOBSF_URL', 'http://localhost:8000').rstrip('/')

    @staticmethod
    def _api_key() -> str:
        return os.getenv('MOBSF_API_KEY', '') or ''

    @classmethod
    def is_available(cls) -> bool:
        return bool(os.getenv('MOBSF_URL') and os.getenv('MOBSF_API_KEY'))

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        base = self._base_url()
        api_key = self._api_key()
        headers = {'Authorization': api_key}
        timeout = kwargs.get('timeout', 120)

        try:
            if not os.path.exists(target):
                return ToolResult(tool=self.name, status=ToolStatus.FAILED,
                                  error=f'file not found: {target}')

            # 1) Upload the app binary.
            with open(target, 'rb') as fh:
                files = {'file': (os.path.basename(target), fh,
                                  'application/octet-stream')}
                up = requests.post(f'{base}/api/v1/upload', files=files,
                                   headers=headers, timeout=timeout)
            up.raise_for_status()
            up_data = up.json()
            scan_hash = up_data.get('hash')
            if not scan_hash:
                return ToolResult(tool=self.name, status=ToolStatus.FAILED,
                                  error=f'upload returned no hash: {up_data}')

            # 2) Trigger the static scan.
            scan = requests.post(f'{base}/api/v1/scan',
                                 data={'hash': scan_hash},
                                 headers=headers, timeout=timeout)
            scan.raise_for_status()

            # 3) Pull the JSON report.
            rep = requests.post(f'{base}/api/v1/report_json',
                                data={'hash': scan_hash},
                                headers=headers, timeout=timeout)
            rep.raise_for_status()
            report = rep.json()

            records = self._summarise(report)
            result.meta['hash'] = scan_hash
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except requests.RequestException as e:
            return ToolResult(tool=self.name, status=ToolStatus.FAILED,
                              error=f'MobSF request failed: {e}')
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result

    @staticmethod
    def _summarise(report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Flatten the (large) MobSF report into a few high/medium findings."""
        records: List[Dict[str, Any]] = []
        if not isinstance(report, dict):
            return records

        # MobSF groups findings under several keys; each is typically a dict of
        # {issue_title: {"severity": ..., ...}}. We pull from the common ones.
        sections = (
            'code_analysis', 'manifest_analysis', 'network_security',
            'binary_analysis', 'permissions',
        )
        for section in sections:
            block = report.get(section)
            # Some MobSF versions nest findings under 'findings'.
            if isinstance(block, dict) and isinstance(block.get('findings'), dict):
                block = block['findings']
            if not isinstance(block, dict):
                continue
            for issue, detail in block.items():
                sev_raw = None
                if isinstance(detail, dict):
                    sev_raw = (detail.get('severity') or detail.get('level')
                               or detail.get('status'))
                sev = normalize_severity(sev_raw)
                if sev not in ('high', 'medium', 'critical'):
                    continue
                records.append({
                    'issue': issue,
                    'severity': sev,
                    'raw': detail,
                })
        return records
