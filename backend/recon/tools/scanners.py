"""
Tool wrappers for active vulnerability scanners (nuclei, dalfox, sqlmap, ffuf, gf).

Each wrapper shells out to the real CLI binary — we never reimplement the scanner
itself. Where a tool emits JSON/JSONL we write it to a scratch file, pass that as
the output flag, parse it, and record the file in `result.output_files`.

All parsers are defensive (try/except) and never raise out of `parse_output`.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon import constants
from recon.tools.util import normalize_severity

import os as _os


def _bundled_templates_path() -> str:
    """
    Default nuclei templates location.

    - docker backend: templates are baked into the toolbox image at
      /opt/nuclei-templates (overridable via NUCLEI_TEMPLATES_PATH).
    - local backend: the repo-bundled nuclei-templates-main/ directory.

    Overridable for either backend with the env var NUCLEI_TEMPLATES_PATH.
    """
    override = _os.getenv('NUCLEI_TEMPLATES_PATH')
    if override:
        return override
    backend = _os.getenv('RECON_EXECUTION_BACKEND', 'local').strip().lower()
    if backend == 'docker':
        return '/opt/nuclei-templates'
    return 'nuclei-templates-main'


@register_tool(constants.NUCLEI)
class NucleiTool(BaseTool):
    """
    Template-based vulnerability scanning via the real `nuclei` CLI
    (ProjectDiscovery). Hosts are written to a scratch list file and results are
    emitted as JSONL to an output file which we parse.
    """

    binary = 'nuclei'
    name = 'nuclei'
    default_timeout = 1800
    acceptable_returncodes = (0, 1)

    def build_command(self, target: str, **kwargs) -> List[str]:
        hosts = kwargs.get('hosts')
        if not hosts:
            hosts = [target]
        infile = self.write_lines([str(h) for h in hosts])
        outfile = self.scratch_file('.jsonl')
        self._infile = infile
        self._outfile = outfile

        rate_limit = kwargs.get('rate_limit', 150)
        severity = kwargs.get('severity', 'critical,high,medium,low,info')
        if isinstance(severity, (list, tuple)):
            severity = ','.join(str(s) for s in severity)

        argv = [
            'nuclei',
            '-l', infile,
            '-jsonl',
            '-o', outfile,
            '-rate-limit', str(rate_limit),
            '-severity', str(severity),
        ]

        templates = kwargs.get('templates')
        if templates:
            if isinstance(templates, (list, tuple)):
                for tpl in templates:
                    argv += ['-t', str(tpl)]
            else:
                argv += ['-t', str(templates)]
        else:
            argv += ['-t', _bundled_templates_path()]

        tags = kwargs.get('tags')
        if tags:
            if isinstance(tags, (list, tuple)):
                tags = ','.join(str(t) for t in tags)
            argv += ['-tags', str(tags)]

        return argv

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                if not isinstance(rec, dict):
                    continue
                info = rec.get('info') or {}
                out.append({
                    'template_id': rec.get('template-id') or rec.get('templateID'),
                    'name': info.get('name'),
                    'severity': normalize_severity(info.get('severity')),
                    'host': rec.get('host'),
                    'matched_at': rec.get('matched-at') or rec.get('matched_at'),
                    'type': rec.get('type'),
                    'raw': rec,
                })
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.DALFOX)
class DalfoxTool(BaseTool):
    """
    XSS scanning via the real `dalfox` CLI. Supports single-URL mode and
    file/list mode. dalfox writes a JSON array (not JSONL) to the output file;
    we read the whole file and json.loads it, falling back to JSONL parsing.
    """

    binary = 'dalfox'
    name = 'dalfox'
    default_timeout = 1200
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        mode = kwargs.get('mode', 'url')
        outfile = self.scratch_file('.json')
        self._outfile = outfile

        if mode == 'file':
            hosts = kwargs.get('hosts') or [target]
            hostsfile = self.write_lines([str(h) for h in hosts])
            self._infile = hostsfile
            return ['dalfox', 'file', hostsfile, '--format', 'json', '-o', outfile]

        return ['dalfox', 'url', target, '--format', 'json', '-o', outfile]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            result.output_files = [path] if path else []
            records: List[Any] = []
            if path and os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        data = json.load(f)
                    if isinstance(data, list):
                        records = data
                    elif isinstance(data, dict):
                        records = [data]
                except Exception:  # noqa: BLE001
                    records = self.read_json_lines(path)
            for rec in records:
                url = None
                if isinstance(rec, dict):
                    url = rec.get('data') or rec.get('url') or rec.get('target')
                out.append({
                    'type': 'xss',
                    'url': url,
                    'severity': 'high',
                    'raw': rec,
                })
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.SQLMAP)
class SqlmapTool(BaseTool):
    """
    SQL injection testing via the real `sqlmap` CLI. Runs non-interactively with
    --batch (required). Injection findings are detected by scanning stdout for
    sqlmap's vulnerability markers.
    """

    binary = 'sqlmap'
    name = 'sqlmap'
    default_timeout = 1800
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        scratchdir = self.scratch_file('')
        # scratch_file made a file; reuse the path as a directory for sqlmap output.
        try:
            if os.path.exists(scratchdir):
                os.remove(scratchdir)
            os.makedirs(scratchdir, exist_ok=True)
        except Exception:  # noqa: BLE001
            pass
        self._outdir = scratchdir

        level = kwargs.get('level', 1)
        risk = kwargs.get('risk', 1)
        argv = [
            'sqlmap',
            '-u', target,
            '--batch',
            '--output-dir', scratchdir,
            '--level', str(level),
            '--risk', str(risk),
        ]
        data = kwargs.get('data')
        if data:
            argv += ['--data', str(data)]
        return argv

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            target = result.command  # informational only
            url = kwargs.get('target')
            for line in result.stdout.splitlines():
                low = line.lower()
                if 'is vulnerable' in low or 'sqlmap identified' in low:
                    out.append({
                        'type': 'sqli',
                        'url': url,
                        'severity': 'critical',
                        'evidence': line.strip(),
                    })
            if self._outdir:
                result.output_files = [self._outdir]
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.FFUF)
class FfufTool(BaseTool):
    """
    Content / directory fuzzing via the real `ffuf` CLI. The `target` must
    contain the `FUZZ` keyword. Results are emitted as JSON to an output file.

    `bypass_403` is accepted as a hook for future 403-bypass header injection;
    it currently adds no extra flags.
    """

    binary = 'ffuf'
    name = 'ffuf'
    default_timeout = 1200
    acceptable_returncodes = (0,)

    _DEFAULT_WORDLIST = '/usr/share/wordlists/dirb/common.txt'

    def build_command(self, target: str, **kwargs) -> List[str]:
        outfile = self.scratch_file('.json')
        self._outfile = outfile

        wordlist = kwargs.get('wordlist')
        if not wordlist:
            wordlist = self._DEFAULT_WORDLIST
            self._wordlist_note = (
                f"no wordlist supplied; defaulting to {self._DEFAULT_WORDLIST}"
            )
        else:
            self._wordlist_note = ''

        argv = [
            'ffuf',
            '-u', target,
            '-w', str(wordlist),
            '-of', 'json',
            '-o', outfile,
            '-mc', '200,204,301,302,307,401,403',
            '-recursion',
        ]
        # bypass_403 reserved for future header-based bypass extension.
        kwargs.get('bypass_403')
        return argv

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            result.output_files = [path] if path else []
            note = getattr(self, '_wordlist_note', '')
            if note:
                result.meta['note'] = note
            if path and os.path.exists(path):
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    data = json.load(f)
                for r in (data.get('results') or []):
                    if not isinstance(r, dict):
                        continue
                    out.append({
                        'url': r.get('url'),
                        'status': r.get('status'),
                        'length': r.get('length'),
                        'raw': r,
                    })
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.GF)
class GfTool(BaseTool):
    """
    Pattern grep over a URL list via the real `gf` CLI (tomnomnom/gf).

    gf normally reads from stdin, but BaseTool.run() does not pipe stdin. The
    orchestrator must therefore provide the URLs in a file via
    `kwargs['urls_file']`; we invoke `gf <pattern> <urls_file>` so gf reads the
    file argument directly. The matched URLs are emitted on stdout, one per line.
    """

    binary = 'gf'
    name = 'gf'
    default_timeout = 300
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        pattern = kwargs.get('pattern', 'xss')
        urls_file = kwargs.get('urls_file')
        if not urls_file:
            # Fall back to treating the target as a file path / single URL list.
            urls_file = self.write_lines([str(target)])
            self._infile = urls_file
        return ['gf', str(pattern), str(urls_file)]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            pattern = kwargs.get('pattern', 'xss')
            for line in result.stdout.splitlines():
                line = line.strip()
                if line:
                    out.append({'pattern': pattern, 'url': line})
        except Exception:  # noqa: BLE001
            return out
        return out
