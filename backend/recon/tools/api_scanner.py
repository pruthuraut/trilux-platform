"""
Authenticated API security scanner — OWASP API Security Top 10 (2023).

Pure-Python BaseTool (no external binary). Given a target that is either:
  * an OpenAPI/Swagger spec URL or inline dict,
  * a Postman collection URL or inline dict, or
  * a bare base URL (light endpoint recon is then attempted),
it builds an endpoint inventory and runs active checks as an *authenticated*
client (credentials supplied via options), covering:

  API1  Broken Object Level Authorization (BOLA)   — cross-user object access
  API2  Broken Authentication                       — unauth access, weak/no auth
  API3  Broken Object Property Level Authorization   — mass assignment / excessive data
  API4  Unrestricted Resource Consumption            — missing rate-limit, unbounded
                                                        pagination, oversized payload, ReDoS
  API5  Broken Function Level Authorization (BFLA)    — low-priv reaching admin funcs
  API6  Unrestricted Access to Sensitive Business Flows — no anti-automation on flows
  API7  Server-Side Request Forgery (SSRF)           — URL params fetch attacker host
  API8  Security Misconfiguration                    — headers, caching, verbose errors, CORS
  API9  Improper Inventory Management                — old versions, debug/docs exposure
  API10 Unsafe Consumption of APIs                   — trust of 3rd-party redirects

Auth model (options JSON):
  headers      : dict of headers applied to the PRIMARY identity's requests
  auth_token   : bearer token for the primary identity (-> Authorization: Bearer ..)
  cookie       : Cookie header for the primary identity
  second_headers / second_auth_token / second_cookie : a SECOND (low-priv) identity,
                 enabling true cross-user BOLA/BFLA comparisons.

Safety: all resource-consumption checks are BOUNDED probes (small bursts, capped
payloads, short ReDoS timing). It never floods. `authorize_load_test` option must
be explicitly true for the (still-bounded) burst check to send >1 request.
"""
from __future__ import annotations

import json
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse, urlencode, parse_qsl, urlunparse

import requests

from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon import constants

_TIMEOUT = 12
_UA = 'trilux-api-scanner/1.0'
_BURST_N = 15                      # bounded rate-limit probe size
_REDOS_TIMEOUT = 6                 # seconds; a response slower than this on a crafted
                                   # input flags a possible ReDoS
_OVERSIZED_BYTES = 200_000         # ~200KB oversized-payload probe (bounded)
_SSRF_CANARY = 'http://169.254.169.254/latest/meta-data/'  # cloud metadata canary
_SENSITIVE_FLOW_HINTS = ('purchase', 'checkout', 'order', 'ticket', 'transfer',
                         'comment', 'vote', 'like', 'coupon', 'redeem', 'signup',
                         'register', 'invite', 'reset', 'booking', 'reserve')
_ADMIN_HINTS = ('admin', 'internal', 'manage', 'config', 'debug', 'root', 'superuser')
_ID_IN_PATH = re.compile(r'/(\d+)(?=/|$)')           # numeric object id in path
_VERSION_IN_PATH = re.compile(r'/v(\d+)(?=/|$)', re.I)


def _sev(name: str) -> str:
    return name


@register_tool(constants.API_SCANNER)
class ApiSecurityScanner(BaseTool):
    name = 'api_scanner'
    binary = ''
    default_timeout = 900

    @classmethod
    def is_available(cls) -> bool:
        return True

    # --------------------------------------------------------------------- #
    # entry
    # --------------------------------------------------------------------- #
    def run(self, target: str, **kwargs) -> ToolResult:
        start = time.monotonic()
        result = ToolResult(tool=self.name, status=ToolStatus.FAILED)
        findings: List[Dict[str, Any]] = []
        try:
            opts = kwargs or {}
            primary = _Identity.from_options(opts, prefix='')
            secondary = _Identity.from_options(opts, prefix='second_')
            self._authorize_load = bool(opts.get('authorize_load_test'))

            base_url, endpoints = self._discover(target, opts, primary)
            if not endpoints:
                result.status = ToolStatus.EMPTY
                result.error = 'no API endpoints discovered (provide openapi_url, ' \
                               'postman_collection, endpoints[], or a reachable base URL)'
                result.duration_s = time.monotonic() - start
                return result

            # Inventory findings (improper inventory management is partly here).
            for ep in endpoints:
                findings.append({
                    'kind': 'api_endpoint', 'severity': 'info',
                    'title': f"{ep['method']} {ep['url']}", 'url': ep['url'],
                    'host': urlparse(ep['url']).netloc, 'tool': self.name,
                    'type': 'endpoint', 'method': ep['method'],
                })

            # Run every check; each returns a list of finding dicts.
            checks = [
                self._check_broken_auth,          # API2
                self._check_bola,                 # API1
                self._check_bfla,                 # API5
                self._check_bopla,                # API3
                self._check_resource_consumption, # API4 (bounded)
                self._check_sensitive_flows,      # API6
                self._check_ssrf,                 # API7
                self._check_misconfig,            # API8
                self._check_inventory,            # API9
                self._check_unsafe_consumption,   # API10
            ]
            for check in checks:
                try:
                    findings.extend(check(base_url, endpoints, primary, secondary, opts) or [])
                except Exception as e:  # never let one check kill the scan
                    findings.append({
                        'kind': 'api_vuln', 'severity': 'info',
                        'title': f'check {check.__name__} error: {e}',
                        'host': urlparse(base_url).netloc, 'tool': self.name,
                        'type': 'scan_error',
                    })

            result.parsed = findings
            result.meta = {'endpoints': len(endpoints), 'base_url': base_url}
            result.status = ToolStatus.SUCCESS if findings else ToolStatus.EMPTY
        except Exception as e:
            result.status = ToolStatus.FAILED
            result.error = str(e)
        result.duration_s = time.monotonic() - start
        return result

    # --------------------------------------------------------------------- #
    # discovery: OpenAPI / Postman / recon
    # --------------------------------------------------------------------- #
    def _discover(self, target: str, opts: Dict[str, Any],
                  ident: '_Identity') -> Tuple[str, List[Dict[str, Any]]]:
        endpoints: List[Dict[str, Any]] = []

        # 1. Explicit endpoints list in options.
        for ep in (opts.get('endpoints') or []):
            if isinstance(ep, str):
                endpoints.append({'method': 'GET', 'url': ep, 'params': {}, 'body': None})
            elif isinstance(ep, dict) and ep.get('url'):
                endpoints.append({'method': (ep.get('method') or 'GET').upper(),
                                  'url': ep['url'], 'params': ep.get('params') or {},
                                  'body': ep.get('body')})

        # 2. Postman collection (inline dict or URL).
        pm = opts.get('postman_collection')
        if pm:
            endpoints.extend(self._parse_postman(self._load_doc(pm, ident)))

        # 3. OpenAPI / Swagger (inline dict or URL), or the target itself if it
        #    looks like a spec URL.
        spec_src = opts.get('openapi_url') or opts.get('openapi')
        if not spec_src and self._looks_like_spec_url(target):
            spec_src = target
        if spec_src:
            spec = self._load_doc(spec_src, ident)
            base, eps = self._parse_openapi(spec, fallback_base=target)
            endpoints.extend(eps)

        # Resolve a base url.
        base_url = opts.get('base_url') or ''
        if not base_url:
            for ep in endpoints:
                if ep['url'].startswith('http'):
                    p = urlparse(ep['url'])
                    base_url = f"{p.scheme}://{p.netloc}"
                    break
        if not base_url:
            base_url = target if target.startswith('http') else f"https://{target}"

        # 4. Light endpoint recon against the base URL (common API roots + spec
        #    auto-discovery) when we still have nothing.
        if not endpoints:
            endpoints.extend(self._recon_endpoints(base_url, ident))

        # Normalize relative URLs against base and dedupe.
        seen = set()
        norm: List[Dict[str, Any]] = []
        for ep in endpoints:
            url = ep['url']
            if not url.startswith('http'):
                url = urljoin(base_url + '/', url.lstrip('/'))
            key = (ep['method'], url)
            if key in seen:
                continue
            seen.add(key)
            ep['url'] = url
            norm.append(ep)
        return base_url, norm

    def _looks_like_spec_url(self, target: str) -> bool:
        t = (target or '').lower()
        return t.endswith(('.json', '.yaml', '.yml')) or 'swagger' in t or 'openapi' in t

    def _load_doc(self, src: Any, ident: '_Identity') -> Dict[str, Any]:
        """Return a dict from an inline dict/JSON string or a URL."""
        if isinstance(src, dict):
            return src
        if isinstance(src, str):
            s = src.strip()
            if s.startswith('{'):
                try:
                    return json.loads(s)
                except json.JSONDecodeError:
                    return {}
            if s.startswith('http'):
                try:
                    r = requests.get(s, headers=ident.headers(), timeout=_TIMEOUT, verify=False)
                    return r.json()
                except Exception:
                    return {}
        return {}

    def _parse_postman(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Flatten a Postman v2.x collection into endpoints (recurses folders)."""
        out: List[Dict[str, Any]] = []

        def _url_str(u: Any) -> str:
            if isinstance(u, str):
                return u
            if isinstance(u, dict):
                if u.get('raw'):
                    return u['raw']
                host = '.'.join(u.get('host', [])) if isinstance(u.get('host'), list) else (u.get('host') or '')
                path = '/'.join(u.get('path', [])) if isinstance(u.get('path'), list) else (u.get('path') or '')
                proto = u.get('protocol', 'https')
                return f"{proto}://{host}/{path}"
            return ''

        def _walk(items: List[Any]):
            for it in items or []:
                if 'item' in it:            # folder
                    _walk(it['item'])
                    continue
                req = it.get('request')
                if not req:
                    continue
                if isinstance(req, str):
                    out.append({'method': 'GET', 'url': req, 'params': {}, 'body': None})
                    continue
                method = (req.get('method') or 'GET').upper()
                url = _url_str(req.get('url'))
                body = None
                b = req.get('body') or {}
                if b.get('mode') == 'raw' and b.get('raw'):
                    try:
                        body = json.loads(b['raw'])
                    except Exception:
                        body = b['raw']
                out.append({'method': method, 'url': url, 'params': {}, 'body': body,
                            'name': it.get('name', '')})

        _walk(doc.get('item', []))
        return out

    def _parse_openapi(self, spec: Dict[str, Any],
                       fallback_base: str) -> Tuple[str, List[Dict[str, Any]]]:
        out: List[Dict[str, Any]] = []
        base = ''
        servers = spec.get('servers') or []
        if servers and isinstance(servers, list) and servers[0].get('url'):
            base = servers[0]['url']
        elif spec.get('host'):  # swagger 2.0
            scheme = (spec.get('schemes') or ['https'])[0]
            base = f"{scheme}://{spec['host']}{spec.get('basePath', '')}"
        if base and not base.startswith('http'):
            p = urlparse(fallback_base if fallback_base.startswith('http') else 'https://' + fallback_base)
            base = f"{p.scheme}://{p.netloc}{base}"

        for path, methods in (spec.get('paths') or {}).items():
            for method, op in (methods or {}).items():
                if method.upper() not in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE'):
                    continue
                url = urljoin((base or fallback_base) + '/', path.lstrip('/'))
                out.append({'method': method.upper(), 'url': url, 'params': {},
                            'body': None, 'name': (op or {}).get('operationId', '')})
        return base or fallback_base, out

    def _recon_endpoints(self, base_url: str, ident: '_Identity') -> List[Dict[str, Any]]:
        """Light API recon: try to auto-find a spec, else probe common API roots."""
        out: List[Dict[str, Any]] = []
        # spec auto-discovery
        for cand in ('/openapi.json', '/swagger.json', '/v2/api-docs',
                     '/v3/api-docs', '/api-docs', '/swagger/v1/swagger.json'):
            try:
                r = requests.get(urljoin(base_url, cand), headers=ident.headers(),
                                 timeout=_TIMEOUT, verify=False)
                if r.status_code == 200 and 'json' in r.headers.get('Content-Type', ''):
                    _, eps = self._parse_openapi(r.json(), fallback_base=base_url)
                    if eps:
                        return eps
            except Exception:
                continue
        # common API roots
        for cand in ('/api', '/api/v1', '/api/v2', '/rest', '/graphql',
                     '/users', '/api/users', '/health', '/status'):
            url = urljoin(base_url, cand)
            try:
                r = requests.get(url, headers=ident.headers(), timeout=_TIMEOUT, verify=False)
                if r.status_code < 500:
                    out.append({'method': 'GET', 'url': url, 'params': {}, 'body': None})
            except Exception:
                continue
        return out

    # --------------------------------------------------------------------- #
    # checks (each returns list[finding dict])
    # --------------------------------------------------------------------- #
    def _finding(self, base_url, url, sev, api_id, title, evidence, **extra):
        f = {
            'kind': 'api_vuln', 'severity': sev, 'title': f'{api_id}: {title}',
            'url': url, 'host': urlparse(url or base_url).netloc, 'tool': self.name,
            'type': api_id, 'owasp_api': api_id, 'evidence': evidence,
        }
        f.update(extra)
        return f

    def _req(self, ident, method, url, **kw):
        kw.setdefault('timeout', _TIMEOUT)
        kw.setdefault('verify', False)
        kw.setdefault('allow_redirects', False)
        h = dict(ident.headers())
        h.update(kw.pop('extra_headers', {}) or {})
        return requests.request(method, url, headers=h, **kw)

    def _check_broken_auth(self, base_url, endpoints, primary, secondary, opts):
        """API2: does the endpoint serve data with NO auth at all?"""
        out = []
        anon = _Identity({}, None, None)  # no credentials
        for ep in endpoints[:40]:
            if ep['method'] != 'GET':
                continue
            try:
                r = self._req(anon, 'GET', ep['url'])
            except requests.RequestException:
                continue
            if r.status_code == 200 and len(r.content) > 0 and _looks_like_data(r):
                # If a primary identity exists and anon gets the same 200, auth is missing.
                out.append(self._finding(
                    base_url, ep['url'], 'high', 'API2',
                    'Endpoint returns data without authentication',
                    f'Unauthenticated GET returned HTTP 200 ({len(r.content)} bytes).',
                    method='GET'))
        return out

    def _check_bola(self, base_url, endpoints, primary, secondary, opts):
        """API1: object id in path — can identity B read identity A's object, or
        can we walk neighbouring ids?"""
        out = []
        for ep in endpoints:
            m = _ID_IN_PATH.search(urlparse(ep['url']).path)
            if not m or ep['method'] != 'GET':
                continue
            oid = int(m.group(1))
            # baseline with primary
            try:
                base_resp = self._req(primary, 'GET', ep['url'])
            except requests.RequestException:
                continue
            if base_resp.status_code != 200:
                continue
            # (a) cross-user: second identity accessing the same object
            if secondary.has_auth():
                try:
                    other = self._req(secondary, 'GET', ep['url'])
                    if other.status_code == 200 and other.content == base_resp.content:
                        out.append(self._finding(
                            base_url, ep['url'], 'critical', 'API1',
                            'Object accessible across users (BOLA)',
                            'A second, unrelated identity retrieved the identical object '
                            f'at id={oid} (HTTP 200, same body).', method='GET'))
                        continue
                except requests.RequestException:
                    pass
            # (b) id-walk: neighbouring ids return other objects to the same user
            for delta in (1, -1):
                neigh = _replace_path_id(ep['url'], oid + delta)
                try:
                    nr = self._req(primary, 'GET', neigh)
                except requests.RequestException:
                    continue
                if nr.status_code == 200 and len(nr.content) > 0 and nr.content != base_resp.content:
                    out.append(self._finding(
                        base_url, neigh, 'high', 'API1',
                        'Sequential object IDs enumerable (possible BOLA)',
                        f'Changing the object id ({oid}->{oid+delta}) returned a different '
                        'object with HTTP 200; verify it belongs to another user.',
                        method='GET'))
                    break
        return out

    def _check_bfla(self, base_url, endpoints, primary, secondary, opts):
        """API5: can a low-priv identity reach admin/privileged functions?"""
        out = []
        low = secondary if secondary.has_auth() else _Identity({}, None, None)
        for ep in endpoints:
            path = urlparse(ep['url']).path.lower()
            if not any(h in path for h in _ADMIN_HINTS):
                continue
            try:
                r = self._req(low, ep['method'], ep['url'],
                              json=ep.get('body') if ep['method'] != 'GET' else None)
            except requests.RequestException:
                continue
            if r.status_code in (200, 201, 202, 204):
                who = 'a low-privilege identity' if low.has_auth() else 'an unauthenticated client'
                out.append(self._finding(
                    base_url, ep['url'], 'critical', 'API5',
                    'Privileged function reachable without proper authorization (BFLA)',
                    f'{who} invoked {ep["method"]} on an admin-looking endpoint '
                    f'(HTTP {r.status_code}).', method=ep['method']))
        return out

    def _check_bopla(self, base_url, endpoints, primary, secondary, opts):
        """API3: mass assignment (write privileged props) + excessive data exposure."""
        out = []
        for ep in endpoints:
            # excessive data exposure: response leaks sensitive-looking props
            if ep['method'] == 'GET':
                try:
                    r = self._req(primary, 'GET', ep['url'])
                    leaked = _sensitive_props(r)
                    if leaked:
                        out.append(self._finding(
                            base_url, ep['url'], 'medium', 'API3',
                            'Excessive data exposure (sensitive properties returned)',
                            f'Response includes sensitive-looking fields: {", ".join(sorted(leaked))}.',
                            method='GET'))
                except requests.RequestException:
                    pass
            # mass assignment: POST/PUT/PATCH accepts a privileged extra prop
            if ep['method'] in ('POST', 'PUT', 'PATCH') and primary.has_auth():
                payload = dict(ep.get('body') or {})
                payload.update({'role': 'admin', 'is_admin': True, 'isAdmin': True})
                try:
                    r = self._req(primary, ep['method'], ep['url'], json=payload)
                    if r.status_code in (200, 201) and re.search(r'"(is_?admin|role)"\s*:\s*("admin"|true)',
                                                                 r.text, re.I):
                        out.append(self._finding(
                            base_url, ep['url'], 'high', 'API3',
                            'Mass assignment of privileged property (BOPLA)',
                            'Server accepted and reflected an injected privileged property '
                            '(role/is_admin) in the response.', method=ep['method']))
                except requests.RequestException:
                    pass
        return out

    def _check_resource_consumption(self, base_url, endpoints, primary, secondary, opts):
        """API4: bounded probes — missing rate limit, unbounded pagination,
        oversized payload acceptance, and ReDoS timing. Never floods."""
        out = []
        if not endpoints:
            return out
        target_ep = next((e for e in endpoints if e['method'] == 'GET'), endpoints[0])
        url = target_ep['url']

        # (a) rate limiting — a small BOUNDED burst; only if explicitly authorized.
        if self._authorize_load:
            codes = []
            for _ in range(_BURST_N):
                try:
                    codes.append(self._req(primary, 'GET', url).status_code)
                except requests.RequestException:
                    break
            if codes and 429 not in codes:
                out.append(self._finding(
                    base_url, url, 'medium', 'API4',
                    'No rate limiting observed (Unrestricted Resource Consumption)',
                    f'{len(codes)} rapid requests returned no HTTP 429 / throttling.',
                    method='GET'))
        else:
            # detection-only: no rate-limit headers present
            try:
                r = self._req(primary, 'GET', url)
                if not _has_ratelimit_headers(r):
                    out.append(self._finding(
                        base_url, url, 'low', 'API4',
                        'No rate-limit headers advertised',
                        'Response exposes no RateLimit/X-RateLimit/Retry-After headers; '
                        'enable authorize_load_test for an active bounded burst probe.',
                        method='GET'))
            except requests.RequestException:
                pass

        # (b) unbounded pagination — does ?limit=100000 get honoured?
        try:
            big = _with_query(url, {'limit': '100000', 'per_page': '100000'})
            r = self._req(primary, 'GET', big)
            if r.status_code == 200 and len(r.content) > 1_000_000:
                out.append(self._finding(
                    base_url, big, 'medium', 'API4',
                    'Unbounded pagination (large limit honoured)',
                    f'limit=100000 returned {len(r.content)} bytes; no server-side cap.',
                    method='GET'))
        except requests.RequestException:
            pass

        # (c) oversized payload acceptance (bounded ~200KB, not a flood)
        writable = next((e for e in endpoints if e['method'] in ('POST', 'PUT', 'PATCH')), None)
        if writable and primary.has_auth():
            blob = {'data': 'A' * _OVERSIZED_BYTES}
            try:
                r = self._req(primary, writable['method'], writable['url'], json=blob)
                if r.status_code not in (413, 400, 431):
                    out.append(self._finding(
                        base_url, writable['url'], 'low', 'API4',
                        'No request-size limit (oversized body accepted)',
                        f'A ~{_OVERSIZED_BYTES//1000}KB body returned HTTP {r.status_code} '
                        '(expected 413 Payload Too Large).', method=writable['method']))
            except requests.RequestException:
                pass

        # (d) ReDoS timing on a search/filter param
        redos_input = 'a' * 50 + '!'
        try:
            probe = _with_query(url, {'q': redos_input, 'search': redos_input, 'filter': redos_input})
            t0 = time.monotonic()
            self._req(primary, 'GET', probe, timeout=_REDOS_TIMEOUT + 2)
            elapsed = time.monotonic() - t0
            if elapsed > _REDOS_TIMEOUT:
                out.append(self._finding(
                    base_url, probe, 'medium', 'API4',
                    'Possible ReDoS (regex denial of service)',
                    f'A crafted pathological input took {elapsed:.1f}s to respond '
                    f'(> {_REDOS_TIMEOUT}s threshold).', method='GET'))
        except requests.Timeout:
            out.append(self._finding(
                base_url, url, 'high', 'API4',
                'Possible ReDoS — request timed out on crafted input',
                f'A pathological regex input did not respond within {_REDOS_TIMEOUT+2}s.',
                method='GET'))
        except requests.RequestException:
            pass
        return out

    def _check_sensitive_flows(self, base_url, endpoints, primary, secondary, opts):
        """API6: sensitive business flow endpoints with no anti-automation."""
        out = []
        for ep in endpoints:
            path = urlparse(ep['url']).path.lower()
            name = (ep.get('name') or '').lower()
            if not any(h in path or h in name for h in _SENSITIVE_FLOW_HINTS):
                continue
            try:
                r = self._req(primary, 'GET', ep['url'])
            except requests.RequestException:
                continue
            body = r.text.lower()
            has_guard = any(g in body for g in ('captcha', 'recaptcha', 'hcaptcha', 'challenge')) \
                or _has_ratelimit_headers(r) or r.status_code == 429
            if not has_guard:
                out.append(self._finding(
                    base_url, ep['url'], 'medium', 'API6',
                    'Sensitive business flow lacks anti-automation controls',
                    f'Flow endpoint (matched "{_first_hint(path + " " + name)}") shows no CAPTCHA/'
                    'challenge or rate-limit signals — susceptible to scripted abuse.',
                    method=ep['method']))
        return out

    def _check_ssrf(self, base_url, endpoints, primary, secondary, opts):
        """API7: params that look like URLs — do they fetch an attacker-controlled host?"""
        out = []
        url_param_names = ('url', 'uri', 'link', 'dest', 'redirect', 'next', 'callback',
                           'webhook', 'image', 'img', 'fetch', 'target', 'to', 'file', 'path')
        canary = opts.get('ssrf_canary') or _SSRF_CANARY
        for ep in endpoints:
            existing = dict(parse_qsl(urlparse(ep['url']).query))
            candidates = set(url_param_names) | {k for k in existing if 'url' in k.lower()}
            for pname in candidates:
                probe = _with_query(ep['url'], {pname: canary})
                try:
                    r = self._req(primary, ep['method'], probe,
                                  json=ep.get('body') if ep['method'] != 'GET' else None,
                                  timeout=_TIMEOUT)
                except requests.RequestException:
                    continue
                # signal: metadata-ish content reflected, or a redirect to the canary host
                if _ssrf_signal(r, canary):
                    out.append(self._finding(
                        base_url, probe, 'critical', 'API7',
                        'Server-Side Request Forgery (SSRF)',
                        f'Parameter "{pname}" caused the server to fetch/reflect the canary '
                        f'({canary}).', method=ep['method'], param=pname))
                    break
        return out

    def _check_misconfig(self, base_url, endpoints, primary, secondary, opts):
        """API8: missing security headers, permissive CORS, verbose errors, caching."""
        out = []
        try:
            r = self._req(primary, 'GET', endpoints[0]['url'])
        except (requests.RequestException, IndexError):
            return out
        h = {k.lower(): v for k, v in r.headers.items()}

        missing = [name for name in (
            'x-content-type-options', 'x-frame-options', 'strict-transport-security',
            'content-security-policy') if name not in h]
        if missing:
            out.append(self._finding(
                base_url, r.url, 'low', 'API8',
                'Missing security headers',
                'Absent: ' + ', '.join(missing) + '.', method='GET'))

        # permissive CORS
        try:
            cr = self._req(primary, 'GET', endpoints[0]['url'],
                           extra_headers={'Origin': 'https://evil.example'})
            acao = cr.headers.get('Access-Control-Allow-Origin', '')
            acac = cr.headers.get('Access-Control-Allow-Credentials', '')
            if acao == '*' or acao == 'https://evil.example':
                sev = 'high' if acac.lower() == 'true' else 'medium'
                out.append(self._finding(
                    base_url, r.url, sev, 'API8',
                    'Permissive CORS policy',
                    f'Access-Control-Allow-Origin reflected/wildcard ("{acao}"), '
                    f'credentials={acac or "false"}.', method='GET'))
        except requests.RequestException:
            pass

        # caching of authenticated/sensitive responses (misconfig | caching)
        cache_control = h.get('cache-control', '')
        if primary.has_auth() and _looks_like_data(r) and (
                'no-store' not in cache_control and 'private' not in cache_control):
            out.append(self._finding(
                base_url, r.url, 'medium', 'API8',
                'Authenticated response is cacheable (caching misconfiguration)',
                f'Cache-Control="{cache_control or "(absent)"}" on an authenticated data '
                'response; sensitive data may be cached by shared proxies.', method='GET'))

        # verbose errors / stack traces on a bad request
        try:
            er = self._req(primary, 'GET', _with_query(endpoints[0]['url'], {"'": "1", 'x[': '1'}))
            if _has_stacktrace(er):
                out.append(self._finding(
                    base_url, er.url, 'medium', 'API8',
                    'Verbose error / stack trace disclosure',
                    'A malformed request produced a stack trace or framework debug page.',
                    method='GET'))
        except requests.RequestException:
            pass
        return out

    def _check_inventory(self, base_url, endpoints, primary, secondary, opts):
        """API9: old API versions still live, debug/docs surfaces exposed."""
        out = []
        # (a) old versions: for any /vN/ endpoint, is /v{N-1}/ still up?
        checked = set()
        for ep in endpoints:
            m = _VERSION_IN_PATH.search(urlparse(ep['url']).path)
            if not m:
                continue
            v = int(m.group(1))
            for older in range(1, v):
                probe = _VERSION_IN_PATH.sub(f'/v{older}', ep['url'], count=1)
                if probe in checked:
                    continue
                checked.add(probe)
                try:
                    r = self._req(primary, 'GET', probe)
                except requests.RequestException:
                    continue
                if r.status_code < 400:
                    out.append(self._finding(
                        base_url, probe, 'medium', 'API9',
                        'Deprecated API version still reachable',
                        f'Older version v{older} responded HTTP {r.status_code} while v{v} is '
                        'current — expands attack surface (Improper Inventory Management).',
                        method='GET'))
        # (b) exposed docs / debug surfaces
        for cand in ('/swagger', '/swagger-ui.html', '/api-docs', '/docs', '/redoc',
                     '/graphql', '/actuator', '/actuator/env', '/debug', '/__debug__'):
            probe = urljoin(base_url, cand)
            try:
                r = self._req(primary, 'GET', probe)
            except requests.RequestException:
                continue
            if r.status_code == 200:
                sev = 'high' if cand in ('/actuator/env', '/debug', '/__debug__') else 'low'
                out.append(self._finding(
                    base_url, probe, sev, 'API9',
                    'Exposed API documentation / debug surface',
                    f'{cand} is publicly reachable (HTTP 200).', method='GET'))
        return out

    def _check_unsafe_consumption(self, base_url, endpoints, primary, secondary, opts):
        """API10: does the API follow redirects to arbitrary third-party hosts?"""
        out = []
        for ep in endpoints[:20]:
            try:
                r = self._req(primary, ep['method'], ep['url'], allow_redirects=False)
            except requests.RequestException:
                continue
            loc = r.headers.get('Location', '')
            if r.status_code in (301, 302, 303, 307, 308) and loc.startswith('http'):
                dest_host = urlparse(loc).netloc
                if dest_host and dest_host != urlparse(ep['url']).netloc:
                    out.append(self._finding(
                        base_url, ep['url'], 'low', 'API10',
                        'Redirect to external host (review third-party trust)',
                        f'Endpoint redirects to a different host ({dest_host}); ensure '
                        'third-party responses are validated (Unsafe Consumption of APIs).',
                        method=ep['method'], redirect=loc))
        return out


# ------------------------------------------------------------------------- #
# helpers
# ------------------------------------------------------------------------- #
class _Identity:
    """An auth context: header set applied to every request."""
    def __init__(self, headers: Dict[str, str], token: Optional[str], cookie: Optional[str]):
        self._h = dict(headers or {})
        self._h.setdefault('User-Agent', _UA)
        if token:
            self._h['Authorization'] = token if token.lower().startswith('bearer') else f'Bearer {token}'
        if cookie:
            self._h['Cookie'] = cookie

    @classmethod
    def from_options(cls, opts: Dict[str, Any], prefix: str) -> '_Identity':
        return cls(
            headers=opts.get(f'{prefix}headers') or {},
            token=opts.get(f'{prefix}auth_token'),
            cookie=opts.get(f'{prefix}cookie'),
        )

    def headers(self) -> Dict[str, str]:
        return dict(self._h)

    def has_auth(self) -> bool:
        return 'Authorization' in self._h or 'Cookie' in self._h


_SENSITIVE_FIELD_RE = re.compile(
    r'"(password|passwd|secret|token|api[_-]?key|ssn|credit[_-]?card|cvv|'
    r'private[_-]?key|access[_-]?token|refresh[_-]?token)"\s*:', re.I)
_STACK_MARKERS = ('Traceback (most recent call last)', 'at java.', 'stack trace',
                  'System.', '.java:', 'werkzeug', 'django.', 'ORA-', 'SQLSTATE')


def _looks_like_data(resp) -> bool:
    ct = resp.headers.get('Content-Type', '')
    return 'json' in ct or 'xml' in ct or (resp.text.strip().startswith(('{', '[')))


def _sensitive_props(resp) -> set:
    try:
        found = set(m.lower() for m in _SENSITIVE_FIELD_RE.findall(resp.text[:20000]))
    except Exception:
        found = set()
    return found


def _has_ratelimit_headers(resp) -> bool:
    keys = {k.lower() for k in resp.headers.keys()}
    return any(k.startswith('x-ratelimit') or k == 'ratelimit' or k == 'retry-after'
               or k == 'ratelimit-limit' for k in keys)


def _has_stacktrace(resp) -> bool:
    body = resp.text[:20000]
    return any(marker in body for marker in _STACK_MARKERS)


def _ssrf_signal(resp, canary) -> bool:
    if resp.status_code in (301, 302, 303, 307, 308):
        if canary_host(canary) in resp.headers.get('Location', ''):
            return True
    body = resp.text[:20000]
    # metadata service response markers
    return ('ami-id' in body or 'instance-id' in body or 'iam/security-credentials' in body
            or canary_host(canary) in body)


def canary_host(canary: str) -> str:
    return urlparse(canary).netloc


def _first_hint(text: str) -> str:
    for h in _SENSITIVE_FLOW_HINTS:
        if h in text:
            return h
    return 'flow'


def _replace_path_id(url: str, new_id: int) -> str:
    p = urlparse(url)
    new_path = _ID_IN_PATH.sub(f'/{new_id}', p.path, count=1)
    return urlunparse(p._replace(path=new_path))


def _with_query(url: str, extra: Dict[str, str]) -> str:
    p = urlparse(url)
    q = dict(parse_qsl(p.query))
    q.update(extra)
    return urlunparse(p._replace(query=urlencode(q)))
