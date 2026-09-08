"""
Custom pure-Python recon checkers.

Unlike the ProjectDiscovery wrappers, these tools are not backed by an external
binary — they are implemented directly in Python using `requests` for HTTP and
the stdlib for DNS. Each subclass therefore:

  * overrides `is_available()` to return True (there is no binary to detect), and
  * overrides `run(self, target, **kwargs) -> ToolResult` to build a ToolResult
    by hand (tool=self.name, status SUCCESS/EMPTY, parsed=[...records...]).

Everything network-touching uses short timeouts and is wrapped in try/except so a
single misbehaving target can never crash the wider pipeline.

Registered tools:
  - S3EnumTool       (constants.S3_ENUM)
  - DnsTakeoverTool  (constants.DNS_TAKEOVER)
  - JsSecretsTool    (constants.JS_SECRETS)
  - TechDetectTool   (constants.TECH_DETECT)
  - BackupFinderTool (constants.BACKUP_FINDER)
"""
from __future__ import annotations

import json  # noqa: F401  (kept for parity / record serialisation use)
import os    # noqa: F401
import re
import socket  # noqa: F401  (used by DnsTakeoverTool fallback path)
import time

import requests

from recon import constants
from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon.tools.util import normalize_severity, strip_scheme

# Optional dependency: dnspython. We degrade gracefully if it is absent.
try:  # pragma: no cover - import guard
    import dns.resolver as _dns_resolver  # type: ignore
    _HAS_DNSPYTHON = True
except Exception:  # noqa: BLE001
    _dns_resolver = None  # type: ignore
    _HAS_DNSPYTHON = False


# Short, polite defaults so checkers stay fast and never hang the pipeline.
_HTTP_TIMEOUT = 8
_USER_AGENT = 'trilux-recon/1.0 (+custom-checker)'
_HEADERS = {'User-Agent': _USER_AGENT}


def _base_name(domain: str) -> str:
    """'example.com' / 'https://www.example.com' -> 'example'."""
    host = strip_scheme(domain)
    parts = [p for p in host.split('.') if p]
    if not parts:
        return host
    # Drop a leading 'www' so 'www.example.com' -> 'example'.
    if parts[0] == 'www' and len(parts) > 1:
        parts = parts[1:]
    return parts[0]


@register_tool(constants.S3_ENUM)
class S3EnumTool(BaseTool):
    """Enumerate likely AWS S3 bucket names derived from the target domain."""

    name = 's3_enum'
    binary = ''

    PREFIXES = ('', 'www-', 'dev-', 'prod-', 'staging-', 'backup-', 'assets-')
    SUFFIXES = (
        '', '-com', '-dev', '-prod', '-staging', '-backup', '-assets',
        '-static', '-media', '-uploads', '-files', '-data', '-logs', '-test',
    )

    @classmethod
    def is_available(cls) -> bool:
        return True

    def _candidates(self, domain: str) -> list:
        base = _base_name(domain)
        host = strip_scheme(domain)
        dashed = host.replace('.', '-')  # example.com -> example-com
        seen = []
        ordered = []

        def add(name: str) -> None:
            name = name.strip('-').lower()
            # S3 bucket name rules: 3-63 chars, lowercase, digits, dots, hyphens.
            if not name or not (3 <= len(name) <= 63):
                return
            if not re.match(r'^[a-z0-9][a-z0-9.\-]*[a-z0-9]$', name):
                return
            if name in seen:
                return
            seen.append(name)
            ordered.append(name)

        for pfx in self.PREFIXES:
            for sfx in self.SUFFIXES:
                add(f'{pfx}{base}{sfx}')
        add(dashed)
        add(f'www-{base}')
        return ordered

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        records = []
        try:
            for bucket in self._candidates(target):
                url = f'https://{bucket}.s3.amazonaws.com/'
                try:
                    resp = requests.get(url, headers=_HEADERS, timeout=_HTTP_TIMEOUT)
                except requests.RequestException:
                    continue
                code = resp.status_code
                body = resp.text or ''
                if code == 200:
                    records.append({
                        'bucket': bucket, 'url': url, 'status': code,
                        'access': 'public',
                        'severity': normalize_severity('high'),
                    })
                elif code == 403:
                    records.append({
                        'bucket': bucket, 'url': url, 'status': code,
                        'access': 'private',
                        'severity': normalize_severity('info'),
                    })
                # 404 / NoSuchBucket -> skip
                elif 'NoSuchBucket' in body:
                    continue
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.DNS_TAKEOVER)
class DnsTakeoverTool(BaseTool):
    """Detect dangling DNS / subdomain-takeover conditions via fingerprints."""

    name = 'dns_takeover'
    binary = ''

    #: service -> body signature indicating an unclaimed/dangling resource.
    FINGERPRINTS = {
        'GitHub Pages': "There isn't a GitHub Pages site here",
        'AWS S3': 'NoSuchBucket',
        'Heroku': 'no-such-app',
        'Azure': '404 Web Site not found',
        'Shopify': 'Sorry, this shop is currently unavailable',
        'Fastly': 'Fastly error: unknown domain',
        'Bitbucket': 'Repository not found',
        'Tumblr': "Whatever you were looking for doesn't currently exist",
        'Zendesk': 'Help Center Closed',
        'Surge.sh': 'project not found',
        'Pantheon': 'The gods are wise',
    }

    #: Cloudflare dangling-origin markers.
    CF_SIGNATURES = ('Error 1016', 'Origin DNS error')

    @classmethod
    def is_available(cls) -> bool:
        return True

    def _resolve_cname(self, host: str):
        if not _HAS_DNSPYTHON:
            return None
        try:
            answers = _dns_resolver.resolve(host, 'CNAME')  # type: ignore[attr-defined]
            for rdata in answers:
                return str(rdata.target).rstrip('.')
        except Exception:  # noqa: BLE001
            return None
        return None

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        result.meta['dnspython'] = _HAS_DNSPYTHON
        if not _HAS_DNSPYTHON:
            result.meta['note'] = 'dnspython not installed — HTTP-body fingerprinting only'
        records = []
        try:
            hosts = kwargs.get('hosts', [target]) or [target]
            for raw in hosts:
                host = strip_scheme(raw)
                cname = self._resolve_cname(host)
                body = ''
                for scheme in ('https', 'http'):
                    try:
                        resp = requests.get(f'{scheme}://{host}/', headers=_HEADERS,
                                            timeout=_HTTP_TIMEOUT, allow_redirects=True)
                        body = resp.text or ''
                        break
                    except requests.RequestException:
                        continue

                vulnerable = False
                service = None
                signature = None

                haystack = f'{body}\n{cname or ""}'
                for svc, sig in self.FINGERPRINTS.items():
                    if sig in haystack:
                        vulnerable = True
                        service = svc
                        signature = sig
                        break

                if not vulnerable:
                    for sig in self.CF_SIGNATURES:
                        if sig in body:
                            vulnerable = True
                            service = 'Cloudflare (CF-1016)'
                            signature = sig
                            break

                if vulnerable or cname:
                    records.append({
                        'host': host,
                        'cname': cname,
                        'service': service,
                        'vulnerable': vulnerable,
                        'signature': signature,
                        'severity': normalize_severity('high' if vulnerable else 'info'),
                    })
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.JS_SECRETS)
class JsSecretsTool(BaseTool):
    """Fetch JavaScript files and regex-scan for leaked secrets and endpoints."""

    name = 'js_secrets'
    binary = ''

    #: label -> compiled secret pattern.
    SECRET_PATTERNS = {
        'aws_access_key': re.compile(r'AKIA[0-9A-Z]{16}'),
        'google_api_key': re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
        'slack_token': re.compile(r'xox[baprs]-[0-9A-Za-z\-]{10,}'),
        'jwt': re.compile(r'eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+'),
        'private_key': re.compile(r'-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'),
        'generic_secret': re.compile(
            r'(?i)(?:api[_-]?key|secret|token|password|passwd)["\']?\s*[:=]\s*'
            r'["\']([A-Za-z0-9_\-\.]{8,})["\']'
        ),
    }

    #: endpoint extraction patterns (fetch/axios/url string literals).
    ENDPOINT_PATTERNS = (
        re.compile(r'(?:fetch|axios(?:\.\w+)?)\s*\(\s*["\']([^"\']+)["\']'),
        re.compile(r'["\'](https?://[^"\'\s]+)["\']'),
        re.compile(r'["\'](/[A-Za-z0-9_\-/\.]{2,})["\']'),
    )

    @classmethod
    def is_available(cls) -> bool:
        return True

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        records = []
        try:
            js_urls = kwargs.get('js_urls', []) or []
            if not js_urls:
                # Fall back to scanning the target itself (could be a .js URL or page).
                host = strip_scheme(target)
                js_urls = [target if target.startswith('http') else f'https://{host}/']

            seen_matches = set()
            for js_url in js_urls:
                try:
                    resp = requests.get(js_url, headers=_HEADERS, timeout=_HTTP_TIMEOUT)
                    content = resp.text or ''
                except requests.RequestException:
                    continue

                for label, pattern in self.SECRET_PATTERNS.items():
                    for m in pattern.findall(content):
                        match = m if isinstance(m, str) else (m[0] if m else '')
                        if not match:
                            continue
                        key = ('secret', label, match, js_url)
                        if key in seen_matches:
                            continue
                        seen_matches.add(key)
                        records.append({
                            'type': 'secret',
                            'secret_type': label,
                            'match': match,
                            'url': js_url,
                            'severity': normalize_severity('high'),
                        })

                for pattern in self.ENDPOINT_PATTERNS:
                    for m in pattern.findall(content):
                        endpoint = m if isinstance(m, str) else (m[0] if m else '')
                        if not endpoint:
                            continue
                        key = ('endpoint', endpoint, js_url)
                        if key in seen_matches:
                            continue
                        seen_matches.add(key)
                        records.append({
                            'type': 'endpoint',
                            'match': endpoint,
                            'url': js_url,
                            'severity': normalize_severity('info'),
                        })
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.TECH_DETECT)
class TechDetectTool(BaseTool):
    """Lightweight Wappalyzer-style tech fingerprinting from headers + body."""

    name = 'tech_detect'
    binary = ''

    #: cookie-name marker -> technology.
    COOKIE_MARKERS = {
        'laravel_session': 'Laravel',
        'phpsessid': 'PHP',
        'jsessionid': 'Java (JSP/Servlet)',
        'wordpress': 'WordPress',
        'wp-settings': 'WordPress',
        'ci_session': 'CodeIgniter',
        'asp.net_sessionid': 'ASP.NET',
        'csrftoken': 'Django',
        'sessionid': 'Django',
    }

    #: body marker -> technology.
    BODY_MARKERS = {
        'wp-content': 'WordPress',
        'wp-includes': 'WordPress',
        '/_next/': 'Next.js',
        'drupal.settings': 'Drupal',
        'data-drupal': 'Drupal',
        'joomla': 'Joomla',
        'ng-version': 'Angular',
        '__nuxt': 'Nuxt.js',
        'react': 'React',
        'shopify': 'Shopify',
        'magento': 'Magento',
    }

    @classmethod
    def is_available(cls) -> bool:
        return True

    def _fingerprint(self, resp) -> list:
        tech = []
        headers = resp.headers or {}

        for header in ('Server', 'X-Powered-By', 'X-Generator', 'X-AspNet-Version'):
            val = headers.get(header)
            if val:
                tech.append(f'{header}: {val}')

        # Set-Cookie may appear multiple times; requests joins them.
        cookies = headers.get('Set-Cookie', '') or ''
        cookies_l = cookies.lower()
        for marker, name in self.COOKIE_MARKERS.items():
            if marker in cookies_l and name not in tech:
                tech.append(name)

        body = (resp.text or '').lower()
        for marker, name in self.BODY_MARKERS.items():
            if marker in body and name not in tech:
                tech.append(name)

        # De-dup while preserving order.
        seen = []
        for t in tech:
            if t not in seen:
                seen.append(t)
        return seen

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        records = []
        try:
            hosts = kwargs.get('hosts', [target]) or [target]
            for raw in hosts:
                host = strip_scheme(raw)
                resp = None
                for scheme in ('https', 'http'):
                    try:
                        resp = requests.get(f'{scheme}://{host}/', headers=_HEADERS,
                                            timeout=_HTTP_TIMEOUT, allow_redirects=True)
                        break
                    except requests.RequestException:
                        continue
                if resp is None:
                    continue
                tech = self._fingerprint(resp)
                records.append({
                    'host': host,
                    'tech': tech,
                    'severity': normalize_severity('info'),
                })
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result


@register_tool(constants.BACKUP_FINDER)
class BackupFinderTool(BaseTool):
    """Probe a host root for exposed backup / config / VCS artefacts."""

    name = 'backup_finder'
    binary = ''

    #: Generic backup / sensitive filenames probed at the host root.
    GENERIC_NAMES = (
        'backup.zip', 'backup.tar.gz', 'backup.sql', 'backup.tar',
        'db.sql', 'database.sql', 'dump.sql',
        '.env', '.env.bak', '.git/config', '.svn/entries',
        'web.config.bak', 'web.config', 'config.php.bak',
        'index.php.bak', 'index.html.bak', 'wp-config.php.bak',
        'site.zip', 'www.zip', 'public_html.zip',
    )

    #: Minimum body size (bytes) to count as a "non-trivial" hit.
    MIN_SIZE = 64

    @classmethod
    def is_available(cls) -> bool:
        return True

    def _names(self, domain: str) -> list:
        base = _base_name(domain)
        host = strip_scheme(domain)
        names = list(self.GENERIC_NAMES)
        for stem in {base, host, host.replace('.', '_')}:
            for ext in ('.zip', '.tar.gz', '.tar', '.sql', '.bak'):
                names.append(f'{stem}{ext}')
        # De-dup preserving order.
        out = []
        for n in names:
            if n not in out:
                out.append(n)
        return out

    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.EMPTY)
        records = []
        try:
            host = strip_scheme(target)
            base_url = target if target.startswith('http') else f'https://{host}'
            base_url = base_url.rstrip('/')

            for name in self._names(target):
                url = f'{base_url}/{name}'
                try:
                    resp = requests.get(url, headers=_HEADERS, timeout=_HTTP_TIMEOUT,
                                        allow_redirects=False)
                except requests.RequestException:
                    continue
                if resp.status_code != 200:
                    continue
                # Determine size from Content-Length or body.
                size = resp.headers.get('Content-Length')
                try:
                    size = int(size) if size is not None else len(resp.content or b'')
                except (TypeError, ValueError):
                    size = len(resp.content or b'')
                if size < self.MIN_SIZE:
                    continue
                records.append({
                    'url': url,
                    'status': 200,
                    'size': size,
                    'severity': normalize_severity('medium'),
                })
            result.parsed = records
            result.status = ToolStatus.SUCCESS if records else ToolStatus.EMPTY
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED, error=str(e))
        result.duration_s = time.monotonic() - start
        return result
