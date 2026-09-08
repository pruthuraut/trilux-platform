"""
Custom pure-Python checkers for on-demand modules:
  - JwtTool       : decode + wordlist brute-force of HS256 signing secrets
  - DepConfusionTool : dependency-confusion check against public registries
  - AemTool       : Adobe AEM exposed-endpoint / misconfig detection

All are pure-Python (no external binary), so they override is_available()->True
and implement run() directly, returning a ToolResult.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, List

import requests

from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon import constants
from recon.tools.util import strip_scheme


def _b64url_decode(segment: str) -> bytes:
    pad = '=' * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + pad)


@register_tool(constants.JWT_TOOL)
class JwtTool(BaseTool):
    """Decode a JWT and attempt to brute-force an HS256 secret from a wordlist."""

    name = 'jwt_tool'
    binary = ''
    default_timeout = 300

    @classmethod
    def is_available(cls) -> bool:
        return True

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.FAILED)
        token = (kwargs.get('token') or target or '').strip()
        try:
            parts = token.split('.')
            if len(parts) != 3:
                result.status = ToolStatus.FAILED
                result.error = 'not a valid JWT (expected 3 dot-separated segments)'
                return result

            header = json.loads(_b64url_decode(parts[0]))
            payload = json.loads(_b64url_decode(parts[1]))
            alg = header.get('alg', '')

            records: List[Dict[str, Any]] = [{
                'type': 'jwt_decode',
                'header': header,
                'payload': payload,
                'alg': alg,
                'severity': 'info',
            }]

            # Flag dangerous configs.
            if alg.lower() == 'none':
                records.append({'type': 'jwt_weakness', 'issue': "alg=none accepted",
                                'severity': 'critical'})

            # Wordlist brute-force for HS* secrets.
            if alg.upper().startswith('HS'):
                wordlist = kwargs.get('wordlist')
                words = kwargs.get('words')
                candidates: List[str] = []
                if words:
                    candidates = list(words)
                elif wordlist and os.path.exists(wordlist):
                    with open(wordlist, 'r', encoding='utf-8', errors='ignore') as f:
                        candidates = [w.strip() for w in f if w.strip()]
                else:
                    candidates = ['secret', 'password', '123456', 'changeme', 'jwt',
                                  'admin', 'key', 'token', 'qwerty', 'test']

                signing_input = f"{parts[0]}.{parts[1]}".encode()
                expected_sig = parts[2]
                digestmod = {'HS256': hashlib.sha256, 'HS384': hashlib.sha384,
                             'HS512': hashlib.sha512}.get(alg.upper(), hashlib.sha256)
                cracked = None
                for w in candidates[:200000]:
                    sig = hmac.new(w.encode(), signing_input, digestmod).digest()
                    b64sig = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()
                    if hmac.compare_digest(b64sig, expected_sig):
                        cracked = w
                        break
                if cracked is not None:
                    records.append({'type': 'jwt_crack', 'issue': 'HS secret cracked',
                                    'secret': cracked, 'severity': 'critical'})

            result.parsed = records
            result.status = ToolStatus.SUCCESS
        except Exception as e:  # noqa: BLE001
            result.status = ToolStatus.FAILED
            result.error = f'jwt analysis error: {e}'
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.DEP_CONFUSION)
class DepConfusionTool(BaseTool):
    """Check whether package names are unclaimed on public registries (npm/pypi)."""

    name = 'dep_confusion'
    binary = ''
    default_timeout = 300

    REGISTRIES = {
        'npm': 'https://registry.npmjs.org/{name}',
        'pypi': 'https://pypi.org/pypi/{name}/json',
    }

    @classmethod
    def is_available(cls) -> bool:
        return True

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.FAILED)
        # packages: list of (name, ecosystem) or just names (default npm)
        packages = kwargs.get('packages') or ([target] if target else [])
        ecosystem = kwargs.get('ecosystem', 'npm')
        records: List[Dict[str, Any]] = []
        try:
            for pkg in packages:
                if isinstance(pkg, (list, tuple)):
                    name, eco = pkg[0], (pkg[1] if len(pkg) > 1 else ecosystem)
                else:
                    name, eco = pkg, ecosystem
                url = self.REGISTRIES.get(eco, self.REGISTRIES['npm']).format(name=name)
                try:
                    resp = requests.get(url, timeout=8)
                    if resp.status_code == 404:
                        records.append({'package': name, 'ecosystem': eco,
                                        'claimed': False, 'severity': 'high',
                                        'issue': 'unclaimed public package — dependency confusion risk'})
                    else:
                        records.append({'package': name, 'ecosystem': eco,
                                        'claimed': True, 'severity': 'info'})
                except requests.RequestException as e:
                    records.append({'package': name, 'ecosystem': eco,
                                    'error': str(e), 'severity': 'unknown'})
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            result.status = ToolStatus.FAILED
            result.error = str(e)
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.AEM)
class AemTool(BaseTool):
    """Detect exposed Adobe AEM (CQ) endpoints and known misconfigurations."""

    name = 'aem'
    binary = ''
    default_timeout = 300

    # Classic AEM exposure paths.
    PATHS = [
        '/libs/granite/core/content/login.html',
        '/system/console',
        '/crx/de/index.jsp',
        '/crx/explorer/browser/index.jsp',
        '/.json',
        '/etc.json',
        '/content.infinity.json',
        '/bin/querybuilder.json',
        '/libs/cq/core/content/welcome.html',
        '/aem/start.html',
    ]

    @classmethod
    def is_available(cls) -> bool:
        return True

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.FAILED)
        base = target.rstrip('/')
        if '://' not in base:
            base = 'https://' + base
        records: List[Dict[str, Any]] = []
        try:
            for path in self.PATHS:
                url = base + path
                try:
                    resp = requests.get(url, timeout=8, verify=False, allow_redirects=False)
                    if resp.status_code == 200 and len(resp.content) > 0:
                        sev = 'high' if any(p in path for p in ('crx', 'system/console', 'querybuilder')) else 'medium'
                        records.append({'type': 'aem_exposure', 'url': url,
                                        'status': resp.status_code,
                                        'path': path, 'severity': sev})
                except requests.RequestException:
                    continue
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
            result.meta['host'] = strip_scheme(base)
        except Exception as e:  # noqa: BLE001
            result.status = ToolStatus.FAILED
            result.error = str(e)
        result.duration_s = time.monotonic() - start
        return result
