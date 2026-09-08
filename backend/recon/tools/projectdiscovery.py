"""
Tool wrappers for the ProjectDiscovery suite and related crawling/discovery
tools (subfinder, httpx, naabu, dnsx, katana, gau).

Each wrapper shells out to the real CLI binary — we never reimplement the tool.
Where a tool supports JSONL output we write it to a scratch file, pass that as
the output flag, parse it with `self.read_json_lines()`, and record the file in
`result.output_files`. gau is the exception: it streams plain URLs to stdout.

All parsers are defensive (try/except) and never raise out of `parse_output`.
"""
from __future__ import annotations

from typing import Any, Dict, List

from recon.tools.base import BaseTool, ToolResult, ToolStatus, register_tool
from recon import constants
from recon.tools.util import normalize_severity, strip_scheme


@register_tool(constants.SUBFINDER)
class SubfinderTool(BaseTool):
    """Passive subdomain enumeration via subfinder (JSONL output)."""

    binary = 'subfinder'
    name = 'subfinder'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        outfile = self.scratch_file('.json')
        self._outfile = outfile
        argv = ['subfinder', '-d', strip_scheme(target), '-silent', '-all', '-oJ', '-o', outfile]
        sources = kwargs.get('sources')
        if sources:
            if isinstance(sources, (list, tuple)):
                sources = ','.join(str(s) for s in sources)
            argv += ['-sources', str(sources)]
        return argv

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                out.append({'host': rec.get('host')})
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.HTTPX)
class HttpxTool(BaseTool):
    """HTTP probing of a list of hosts via httpx (JSON output)."""

    binary = 'httpx'
    name = 'httpx'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        hosts = kwargs.get('hosts')
        if not hosts:
            hosts = [target]
        infile = self.write_lines([str(h) for h in hosts])
        outfile = self.scratch_file('.json')
        self._infile = infile
        self._outfile = outfile
        return [
            'httpx', '-l', infile, '-silent', '-json', '-o', outfile,
            '-follow-redirects', '-status-code', '-title', '-tech-detect',
            '-web-server',
        ]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                out.append({
                    'url': rec.get('url'),
                    'status_code': rec.get('status_code'),
                    'title': rec.get('title'),
                    'tech': rec.get('tech'),
                    'webserver': rec.get('webserver'),
                })
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.NAABU)
class NaabuTool(BaseTool):
    """Port scanning of a list of hosts via naabu (JSON output)."""

    binary = 'naabu'
    name = 'naabu'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        hosts = kwargs.get('hosts')
        if not hosts:
            hosts = [target]
        infile = self.write_lines([str(h) for h in hosts])
        outfile = self.scratch_file('.json')
        self._infile = infile
        self._outfile = outfile
        argv = ['naabu', '-list', infile, '-silent', '-json', '-o', outfile]
        ports = kwargs.get('ports')
        if ports:
            if isinstance(ports, (list, tuple)):
                ports = ','.join(str(p) for p in ports)
            argv += ['-p', str(ports)]
        else:
            argv += ['-top-ports', '1000']
        return argv

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                out.append({'host': rec.get('host'), 'port': rec.get('port')})
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.DNSX)
class DnsxTool(BaseTool):
    """DNS resolution / record lookup for a list of hosts via dnsx (JSON output)."""

    binary = 'dnsx'
    name = 'dnsx'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        hosts = kwargs.get('hosts')
        if not hosts:
            hosts = [target]
        infile = self.write_lines([str(h) for h in hosts])
        outfile = self.scratch_file('.json')
        self._infile = infile
        self._outfile = outfile
        return [
            'dnsx', '-l', infile, '-silent', '-json', '-o', outfile,
            '-cname', '-a', '-resp',
        ]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                if isinstance(rec, dict):
                    out.append(rec)
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.KATANA)
class KatanaTool(BaseTool):
    """Web crawling of a target via katana (JSONL output)."""

    binary = 'katana'
    name = 'katana'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        outfile = self.scratch_file('.json')
        self._outfile = outfile
        depth = kwargs.get('depth') or 3
        return [
            'katana', '-u', target, '-silent', '-jsonl', '-o', outfile,
            '-d', str(depth), '-jc',
        ]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            path = getattr(self, '_outfile', None)
            records = self.read_json_lines(path)
            result.output_files = [path] if path else []
            for rec in records:
                url = (rec.get('request', {}) or {}).get('endpoint') or rec.get('endpoint')
                out.append({'url': url})
        except Exception:  # noqa: BLE001
            return out
        return out


@register_tool(constants.GAU)
class GauTool(BaseTool):
    """Fetch known URLs for a target via gau (plain URLs on stdout)."""

    binary = 'gau'
    name = 'gau'
    default_timeout = 600
    acceptable_returncodes = (0,)

    def build_command(self, target: str, **kwargs) -> List[str]:
        return ['gau', '--subs', strip_scheme(target)]

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            for line in result.stdout.splitlines():
                line = line.strip()
                if line:
                    out.append({'url': line})
        except Exception:  # noqa: BLE001
            return out
        return out
