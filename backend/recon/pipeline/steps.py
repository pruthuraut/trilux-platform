"""
The 12-step domain recon pipeline.

Each step shells out to the registered tool wrappers, reads/writes the shared
PipelineContext, and returns a StepOutcome (records + normalized findings +
the local artifact to upload to R2). Steps tolerate missing tools (the wrapper
returns SKIPPED) so a partial toolbox still yields partial results.

Order:
   1 Subdomain Enumeration   (subfinder)
   2 Live Host Detection     (httpx)
   3 Port Scanning           (naabu)
   4 Tech Detection          (tech_detect)
   5 DNS Takeover Checks     (dns_takeover)
   6 S3 Bucket Enumeration   (s3_enum)
   7 Nuclei Scanning         (nuclei)
   8 JavaScript Scanning     (js_secrets)
   9 URL Collection          (gau + katana)
  10 GF Pattern Matching     (gf)
  11 Backup File Discovery   (backup_finder)
  12 Misconfiguration Scan   (nuclei misconfig templates)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from recon import constants
from recon.tools.base import get_tool, ToolStatus
from recon.tools.util import normalize_severity, strip_scheme
from recon.pipeline.base import Step, StepOutcome, register_step

logger = logging.getLogger('recon')


def _status_from_tool(tool_status: ToolStatus) -> str:
    return {
        ToolStatus.SUCCESS: 'success',
        ToolStatus.EMPTY: 'empty',
        ToolStatus.SKIPPED: 'skipped',
        ToolStatus.TIMEOUT: 'failed',
        ToolStatus.FAILED: 'failed',
    }.get(tool_status, 'failed')


@register_step
class SubdomainEnumStep(Step):
    number = 1
    key = 'subdomain_enum'
    title = 'Subdomain Enumeration'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.SUBFINDER)
        if not tool:
            return self._outcome(tool='subfinder', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target, sources=self.ctx.get_option('sources'))
        hosts = sorted({r.get('host') for r in res.parsed if r.get('host')})
        # Always include the root domain itself.
        if self.ctx.target not in hosts:
            hosts.append(self.ctx.target)
        self.ctx.subdomains = hosts
        findings = [{'kind': 'subdomain', 'severity': 'info', 'host': h, 'title': h, 'tool': 'subfinder'}
                    for h in hosts]
        artifact = tool.write_lines(hosts) if hosts else None
        return self._outcome(tool='subfinder', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=artifact, artifact_name='subdomains.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class LiveHostStep(Step):
    number = 2
    key = 'live_hosts'
    title = 'Live Host Detection'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.HTTPX)
        hosts = self.ctx.subdomains or [self.ctx.target]
        if not tool:
            return self._outcome(tool='httpx', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target, hosts=hosts)
        live = []
        findings = []
        for r in res.parsed:
            url = r.get('url')
            if not url:
                continue
            live.append(url)
            findings.append({'kind': 'live_host', 'severity': 'info', 'host': strip_scheme(url),
                             'url': url, 'title': r.get('title') or url, 'tool': 'httpx', 'data': r})
        self.ctx.live_hosts = live
        # capture tech if httpx surfaced it
        for r in res.parsed:
            techs = r.get('tech') or []
            if techs and r.get('url'):
                self.ctx.tech.setdefault(strip_scheme(r['url']), []).extend(
                    techs if isinstance(techs, list) else [techs])
        artifact = tool.write_lines(live) if live else None
        return self._outcome(tool='httpx', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=artifact, artifact_name='live-subs.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class PortScanStep(Step):
    number = 3
    key = 'port_scan'
    title = 'Port Scanning'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.NAABU)
        hosts = [strip_scheme(h) for h in (self.ctx.live_hosts or self.ctx.subdomains or [self.ctx.target])]
        hosts = sorted(set(hosts))
        if not tool:
            return self._outcome(tool='naabu', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target, hosts=hosts, ports=self.ctx.get_option('ports'))
        findings = []
        for r in res.parsed:
            host, port = r.get('host') or r.get('ip'), r.get('port')
            if host and port:
                self.ctx.open_ports.setdefault(host, []).append(port)
                findings.append({'kind': 'port', 'severity': 'info', 'host': host,
                                 'title': f"{host}:{port}", 'tool': 'naabu', 'data': r})
        return self._outcome(tool='naabu', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=tool.write_lines([f"{f['host']}:{f['data'].get('port')}" for f in findings]) if findings else None,
                             artifact_name='open-ports.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class TechDetectStep(Step):
    number = 4
    key = 'tech_detect'
    title = 'Tech Detection'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.TECH_DETECT)
        hosts = self.ctx.live_hosts or [self.ctx.target]
        if not tool:
            return self._outcome(tool='tech_detect', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target, hosts=hosts)
        findings = []
        for r in res.parsed:
            host = r.get('host') or self.ctx.target
            techs = r.get('tech') or []
            if techs:
                self.ctx.tech.setdefault(strip_scheme(host), []).extend(techs)
                findings.append({'kind': 'tech', 'severity': 'info', 'host': strip_scheme(host),
                                 'title': ', '.join(techs)[:200], 'tool': 'tech_detect', 'data': r})
        return self._outcome(tool='tech_detect', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class DnsTakeoverStep(Step):
    number = 5
    key = 'dns_takeover'
    title = 'DNS Takeover Checks'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.DNS_TAKEOVER)
        hosts = [strip_scheme(h) for h in (self.ctx.subdomains or [self.ctx.target])]
        if not tool:
            return self._outcome(tool='dns_takeover', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target, hosts=hosts)
        findings = []
        for r in res.parsed:
            vulnerable = r.get('vulnerable')
            findings.append({'kind': 'takeover',
                             'severity': normalize_severity(r.get('severity', 'high' if vulnerable else 'info')),
                             'host': r.get('host', ''), 'title': r.get('service') or 'dangling record',
                             'tool': 'dns_takeover', 'data': r})
        return self._outcome(tool='dns_takeover', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class S3EnumStep(Step):
    number = 6
    key = 's3_enum'
    title = 'S3 Bucket Enumeration'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.S3_ENUM)
        if not tool:
            return self._outcome(tool='s3_enum', status='skipped', error='tool not registered')
        res = tool.run(self.ctx.target)
        findings = [{'kind': 's3_bucket', 'severity': normalize_severity(r.get('severity')),
                     'host': r.get('bucket', ''), 'url': r.get('url'),
                     'title': f"{r.get('bucket')} ({r.get('access')})", 'tool': 's3_enum', 'data': r}
                    for r in res.parsed]
        return self._outcome(tool='s3_enum', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class NucleiScanStep(Step):
    number = 7
    key = 'nuclei_scan'
    title = 'Nuclei Scanning'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.NUCLEI)
        hosts = self.ctx.live_hosts or [self.ctx.target]
        if not tool:
            return self._outcome(tool='nuclei', status='skipped', error='tool not registered')
        # Zero-days mode: cross-reference detected tech -> tags (best-effort).
        tags = None
        if self.ctx.get_option('zero_days') and self.ctx.tech:
            techset = {t.lower() for techs in self.ctx.tech.values() for t in techs}
            tags = ','.join(sorted(techset)) or None
        res = tool.run(self.ctx.target, hosts=hosts,
                       rate_limit=self.ctx.get_option('rate_limit', 150),
                       templates=self.ctx.get_option('templates'), tags=tags)
        findings = []
        for r in res.parsed:
            findings.append({'kind': 'vulnerability', 'severity': normalize_severity(r.get('severity')),
                             'host': strip_scheme(r.get('host', '')), 'url': r.get('matched_at'),
                             'title': r.get('name') or r.get('template_id') or 'nuclei finding',
                             'tool': 'nuclei', 'data': r.get('raw', r)})
        artifact = tool.write_lines([str(r) for r in res.parsed]) if res.parsed else None
        return self._outcome(tool='nuclei', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=artifact, artifact_name='nuclei-findings.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class JsScanStep(Step):
    number = 8
    key = 'js_scan'
    title = 'JavaScript Scanning'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.JS_SECRETS)
        if not tool:
            return self._outcome(tool='js_secrets', status='skipped', error='tool not registered')
        # JS urls discovered so far (from crawl) or just scan live hosts.
        js_urls = [u for u in self.ctx.urls if u.lower().endswith('.js')] or self.ctx.live_hosts
        res = tool.run(self.ctx.target, js_urls=js_urls)
        findings = []
        for r in res.parsed:
            is_secret = r.get('type') == 'secret'
            findings.append({'kind': 'secret' if is_secret else 'url',
                             'severity': normalize_severity(r.get('severity', 'high' if is_secret else 'info')),
                             'host': strip_scheme(r.get('url', '')), 'url': r.get('url'),
                             'title': (r.get('match') or '')[:200], 'tool': 'js_secrets', 'data': r})
        return self._outcome(tool='js_secrets', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class UrlCollectionStep(Step):
    number = 9
    key = 'url_collection'
    title = 'URL Collection'

    def run(self) -> StepOutcome:
        urls: List[str] = []
        records: List[Dict[str, Any]] = []
        statuses = []
        cmds = []
        dur = 0.0
        for key in (constants.GAU, constants.KATANA):
            tool = get_tool(key)
            if not tool:
                continue
            res = tool.run(self.ctx.target, depth=self.ctx.get_option('depth', 3))
            statuses.append(res.status)
            cmds.append(res.command)
            dur += res.duration_s
            for r in res.parsed:
                u = r.get('url')
                if u:
                    urls.append(u)
                    records.append(r)
        urls = sorted(set(urls))
        self.ctx.urls = urls
        self.ctx.js_files = [u for u in urls if u.lower().endswith('.js')]
        # overall status: success if any tool produced urls
        status = 'success' if urls else ('skipped' if not statuses else 'empty')
        artifact = get_tool(constants.GAU).write_lines(urls) if urls and get_tool(constants.GAU) else None
        findings = [{'kind': 'url', 'severity': 'info', 'host': strip_scheme(u), 'url': u,
                     'title': u[:200], 'tool': 'gau/katana'} for u in urls[:5000]]
        return self._outcome(tool='gau/katana', status=status, records=records, findings=findings,
                             artifact_path=artifact, artifact_name='all-urls.txt',
                             command=' ; '.join(cmds), duration_s=dur)


@register_step
class GfPatternStep(Step):
    number = 10
    key = 'gf_patterns'
    title = 'GF Pattern Matching'

    PATTERNS = ['xss', 'sqli', 'ssti', 'lfi', 'ssrf', 'redirect', 'rce']

    def run(self) -> StepOutcome:
        tool = get_tool(constants.GF)
        if not tool:
            return self._outcome(tool='gf', status='skipped', error='tool not registered')
        if not self.ctx.urls:
            return self._outcome(tool='gf', status='empty', error='no URLs collected (step 9 produced none)')
        urls_file = tool.write_lines(self.ctx.urls)
        findings = []
        records = []
        cmds = []
        dur = 0.0
        any_ran = False
        for pattern in self.ctx.get_option('gf_patterns', self.PATTERNS):
            res = tool.run(self.ctx.target, pattern=pattern, urls_file=urls_file)
            if res.status != ToolStatus.SKIPPED:
                any_ran = True
            cmds.append(res.command)
            dur += res.duration_s
            for r in res.parsed:
                records.append(r)
                findings.append({'kind': 'gf_match', 'severity': 'low', 'host': strip_scheme(r.get('url', '')),
                                 'url': r.get('url'), 'title': f"{pattern}: {r.get('url', '')[:160]}",
                                 'tool': 'gf', 'data': r})
        status = 'skipped' if not any_ran else ('success' if findings else 'empty')
        artifact = tool.write_lines([f["data"].get("pattern", "") + " " + (f.get("url") or "") for f in findings]) if findings else None
        return self._outcome(tool='gf', status=status, records=records, findings=findings,
                             artifact_path=artifact, artifact_name='gf-matches.txt',
                             command=' ; '.join(cmds), duration_s=dur)


@register_step
class BackupDiscoveryStep(Step):
    number = 11
    key = 'backup_discovery'
    title = 'Backup File Discovery'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.BACKUP_FINDER)
        if not tool:
            return self._outcome(tool='backup_finder', status='skipped', error='tool not registered')
        findings = []
        records = []
        dur = 0.0
        cmds = []
        for host in (self.ctx.live_hosts or [self.ctx.target]):
            res = tool.run(host)
            dur += res.duration_s
            cmds.append(res.command)
            for r in res.parsed:
                records.append(r)
                findings.append({'kind': 'backup_file', 'severity': normalize_severity(r.get('severity', 'medium')),
                                 'host': strip_scheme(r.get('url', host)), 'url': r.get('url'),
                                 'title': r.get('url', '')[:200], 'tool': 'backup_finder', 'data': r})
        status = 'success' if findings else 'empty'
        return self._outcome(tool='backup_finder', status=status, records=records, findings=findings,
                             command=' ; '.join(cmds), duration_s=dur)


@register_step
class MisconfigScanStep(Step):
    number = 12
    key = 'misconfig_scan'
    title = 'Misconfiguration Scan'

    def run(self) -> StepOutcome:
        tool = get_tool(constants.NUCLEI)
        hosts = self.ctx.live_hosts or [self.ctx.target]
        if not tool:
            return self._outcome(tool='nuclei', status='skipped', error='tool not registered')
        # Run nuclei restricted to misconfiguration/exposure tags.
        res = tool.run(self.ctx.target, hosts=hosts,
                       rate_limit=self.ctx.get_option('rate_limit', 150),
                       tags='misconfig,exposure,config')
        findings = []
        for r in res.parsed:
            findings.append({'kind': 'misconfig', 'severity': normalize_severity(r.get('severity')),
                             'host': strip_scheme(r.get('host', '')), 'url': r.get('matched_at'),
                             'title': r.get('name') or r.get('template_id') or 'misconfiguration',
                             'tool': 'nuclei', 'data': r.get('raw', r)})
        artifact = tool.write_lines([str(r) for r in res.parsed]) if res.parsed else None
        return self._outcome(tool='nuclei', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=artifact, artifact_name='misconfig-findings.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)


@register_step
class ApiScanStep(Step):
    """
    Step 13 — Authenticated API security scan (OWASP API Top 10).

    Auto-triggers when the run has surfaced API-related attack surface (API paths
    or spec endpoints among collected URLs / live hosts), or when explicitly
    requested via options['api_scan']=True. Auth material and endpoint hints are
    read from options: headers, auth_token, cookie, second_* (low-priv identity),
    openapi_url, postman_collection, endpoints, authorize_load_test.
    """
    number = 13
    key = 'api_scan'
    title = 'API Security Scan (OWASP API Top 10)'

    _API_MARKERS = ('/api/', '/api', '/rest/', '/graphql', '/v1/', '/v2/', '/v3/',
                    'swagger', 'openapi', 'api-docs')

    def _api_surface(self):
        """Return a de-duped list of candidate API endpoint URLs from context."""
        found = []
        for u in (self.ctx.urls or []):
            lu = u.lower()
            if any(m in lu for m in self._API_MARKERS):
                found.append(u)
        return sorted(set(found))

    def run(self) -> StepOutcome:
        tool = get_tool(constants.API_SCANNER)
        if not tool:
            return self._outcome(tool='api_scanner', status='skipped', error='tool not registered')

        opts = self.ctx.options or {}
        forced = bool(opts.get('api_scan'))
        explicit = bool(opts.get('openapi_url') or opts.get('postman_collection') or opts.get('endpoints'))
        api_urls = self._api_surface()

        if not (forced or explicit or api_urls):
            return self._outcome(tool='api_scanner', status='skipped',
                                 error='no API surface detected (set options.api_scan=true to force)')

        # Base target: prefer an explicit base_url, else first live host, else root.
        base = opts.get('base_url') or (self.ctx.live_hosts[0] if self.ctx.live_hosts
                                        else self.ctx.target)
        # Pass through auth + discovered endpoints so recon feeds the scan.
        run_opts = dict(opts)
        if api_urls and not run_opts.get('endpoints'):
            run_opts['endpoints'] = api_urls[:100]
        run_opts['base_url'] = base

        res = tool.run(base, **run_opts)
        findings = []
        for r in res.parsed:
            findings.append({
                'kind': r.get('kind') or 'api_vuln',
                'severity': normalize_severity(r.get('severity')),
                'host': strip_scheme(r.get('host', '')),
                'url': r.get('url'),
                'title': r.get('title') or r.get('type') or 'api finding',
                'tool': 'api_scanner', 'data': r,
            })
        artifact = tool.write_lines([str(r) for r in res.parsed]) if res.parsed else None
        return self._outcome(tool='api_scanner', status=_status_from_tool(res.status),
                             records=res.parsed, findings=findings,
                             artifact_path=artifact, artifact_name='api-findings.txt',
                             command=res.command, duration_s=res.duration_s, error=res.error)
