"""
Vulnerability knowledge base for the cross-file taint engine: sinks, sources,
sanitizers, and the CWE -> OWASP mapping.

This is *data*, deliberately separated from the analysis algorithm. The curated
sink/source/sanitizer sets were validated in prior work; the cross-file engine
in taint_engine.py consumes them but implements its own repo-wide algorithm.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SinkSpec:
    name: str
    cwe: str
    label: str
    # Positional arg indices that carry the dangerous value. Empty + any_arg=True
    # means "taint in any argument fires the sink".
    arg_positions: tuple[int, ...] = ()
    arg_keywords: tuple[str, ...] = ()
    any_arg: bool = True


# Dotted-name sinks matched on the full call target (e.g. "subprocess.run").
DOTTED_SINKS: dict[str, SinkSpec] = {
    # Code execution
    "eval": SinkSpec("eval", "CWE-95", "code execution (eval)"),
    "exec": SinkSpec("exec", "CWE-95", "code execution (exec)"),
    "__import__": SinkSpec("__import__", "CWE-95", "dynamic import"),
    # OS command execution
    "os.system": SinkSpec("os.system", "CWE-78", "OS command execution"),
    "os.popen": SinkSpec("os.popen", "CWE-78", "OS command execution"),
    "os.execl": SinkSpec("os.execl", "CWE-78", "process exec"),
    "os.execv": SinkSpec("os.execv", "CWE-78", "process exec"),
    "os.execve": SinkSpec("os.execve", "CWE-78", "process exec"),
    "os.spawnl": SinkSpec("os.spawnl", "CWE-78", "process spawn"),
    "subprocess.run": SinkSpec("subprocess.run", "CWE-78", "subprocess execution"),
    "subprocess.call": SinkSpec("subprocess.call", "CWE-78", "subprocess execution"),
    "subprocess.Popen": SinkSpec("subprocess.Popen", "CWE-78", "subprocess execution"),
    "subprocess.check_output": SinkSpec("subprocess.check_output", "CWE-78", "subprocess execution"),
    "subprocess.check_call": SinkSpec("subprocess.check_call", "CWE-78", "subprocess execution"),
    "subprocess.getoutput": SinkSpec("subprocess.getoutput", "CWE-78", "subprocess execution"),
    # Deserialization
    "pickle.loads": SinkSpec("pickle.loads", "CWE-502", "unsafe deserialization"),
    "pickle.load": SinkSpec("pickle.load", "CWE-502", "unsafe deserialization"),
    "cpickle.loads": SinkSpec("cpickle.loads", "CWE-502", "unsafe deserialization"),
    "yaml.load": SinkSpec("yaml.load", "CWE-502", "unsafe deserialization"),
    "yaml.unsafe_load": SinkSpec("yaml.unsafe_load", "CWE-502", "unsafe deserialization"),
    "marshal.loads": SinkSpec("marshal.loads", "CWE-502", "unsafe deserialization"),
    "dill.loads": SinkSpec("dill.loads", "CWE-502", "unsafe deserialization"),
    # File / path
    "open": SinkSpec("open", "CWE-22", "file access (path traversal)", arg_positions=(0,), any_arg=False),
    "io.open": SinkSpec("io.open", "CWE-22", "file access (path traversal)", arg_positions=(0,), any_arg=False),
    "os.remove": SinkSpec("os.remove", "CWE-22", "file deletion"),
    "os.unlink": SinkSpec("os.unlink", "CWE-22", "file deletion"),
    "shutil.rmtree": SinkSpec("shutil.rmtree", "CWE-22", "recursive deletion"),
    "send_file": SinkSpec("send_file", "CWE-22", "serve file by path"),
    # SSRF / outbound
    "requests.get": SinkSpec("requests.get", "CWE-918", "outbound request (SSRF)", arg_positions=(0,), arg_keywords=("url",)),
    "requests.post": SinkSpec("requests.post", "CWE-918", "outbound request (SSRF)", arg_positions=(0,), arg_keywords=("url",)),
    "requests.put": SinkSpec("requests.put", "CWE-918", "outbound request (SSRF)", arg_positions=(0,), arg_keywords=("url",)),
    "requests.delete": SinkSpec("requests.delete", "CWE-918", "outbound request (SSRF)", arg_positions=(0,), arg_keywords=("url",)),
    "requests.head": SinkSpec("requests.head", "CWE-918", "outbound request (SSRF)", arg_positions=(0,), arg_keywords=("url",)),
    "requests.request": SinkSpec("requests.request", "CWE-918", "outbound request (SSRF)"),
    "httpx.get": SinkSpec("httpx.get", "CWE-918", "outbound request (SSRF)"),
    "httpx.post": SinkSpec("httpx.post", "CWE-918", "outbound request (SSRF)"),
    "urllib.request.urlopen": SinkSpec("urllib.request.urlopen", "CWE-918", "outbound request (SSRF)"),
    "urllib.request.urlretrieve": SinkSpec("urllib.request.urlretrieve", "CWE-918", "outbound request (SSRF)"),
    "aiohttp.request": SinkSpec("aiohttp.request", "CWE-918", "outbound request (SSRF)"),
    # Template / SSTI
    "Template": SinkSpec("Template", "CWE-94", "template injection (SSTI)"),
    "render_template_string": SinkSpec("render_template_string", "CWE-94", "template injection (SSTI)"),
    # Archive extraction (path traversal / zip-slip)
    "extractall": SinkSpec("extractall", "CWE-22", "archive extraction (zip-slip)"),
}


@dataclass(frozen=True)
class MethodSink:
    """Sink matched by method (attribute) name regardless of receiver dotted path,
    with an optional receiver-substring guard to avoid false matches."""
    spec: SinkSpec
    receiver_any_of: tuple[str, ...] = ()


METHOD_SINKS: dict[str, MethodSink] = {
    "execute": MethodSink(SinkSpec(".execute", "CWE-89", "SQL execution")),
    "executemany": MethodSink(SinkSpec(".executemany", "CWE-89", "SQL execution")),
    "executescript": MethodSink(SinkSpec(".executescript", "CWE-89", "SQL execution")),
    "raw": MethodSink(SinkSpec(".raw", "CWE-89", "raw SQL (ORM)")),
    "system": MethodSink(SinkSpec(".system", "CWE-78", "OS command execution"), receiver_any_of=("os",)),
    "popen": MethodSink(SinkSpec(".popen", "CWE-78", "OS command execution"), receiver_any_of=("os", "subprocess")),
    "loads": MethodSink(SinkSpec(".loads", "CWE-502", "deserialization"),
                        receiver_any_of=("pickle", "marshal", "yaml", "dill", "cpickle")),
    "run": MethodSink(SinkSpec(".run", "CWE-78", "subprocess execution"), receiver_any_of=("subprocess",)),
}


# Sanitizers: passing a tainted value through one of these neutralizes it.
SANITIZERS: set[str] = {
    "int", "float", "bool", "len", "abs", "round",
    "shlex.quote", "quote", "pipes.quote",
    "os.path.basename", "basename", "secure_filename", "os.path.abspath",
    "werkzeug.utils.secure_filename",
    "shutil.which",
    "html.escape", "escape", "markupsafe.escape", "cgi.escape",
    "urllib.parse.quote", "urllib.parse.quote_plus",
    "hashlib.sha256", "hashlib.md5", "uuid.uuid4",
}
SANITIZER_METHODS: set[str] = {"isdigit", "isalpha", "isalnum", "isidentifier", "hexdigest"}


# HTTP / request-input attribute accessors that introduce taint when read off a
# request-like object (Django/Flask/FastAPI/DRF). Used in addition to the plain
# source containers below.
SOURCE_ATTRS = {
    "GET", "POST", "data", "query_params", "body", "COOKIES", "FILES",
    "headers", "args", "form", "values", "json", "params", "path_params",
}
# Bare names that, when they appear as a function parameter or module-level read,
# are treated as attacker-controlled entry points.
SOURCE_CONTAINERS = {
    "arguments", "args", "params", "kwargs", "payload", "body", "request",
    "req", "input", "inputs", "data", "form", "query", "json",
}
# Framework view/handler decorators that mark a function as an entry point whose
# parameters are attacker-controlled.
ENTRYPOINT_DECORATORS = {
    "app.route", "route", "get", "post", "put", "delete", "patch",
    "api_view", "require_http_methods", "csrf_exempt", "action",
    "call_tool", "tool", "mcp_tool", "handle_call_tool",
}
ENTRYPOINT_FUNC_NAMES = {
    "handle_call_tool", "call_tool", "dispatch", "handle_tool",
    "get", "post", "put", "delete", "patch",  # DRF APIView / class methods
}


CWE_OWASP: dict[str, str] = {
    "CWE-78": "A03:2021 Injection",
    "CWE-89": "A03:2021 Injection",
    "CWE-94": "A03:2021 Injection",
    "CWE-95": "A03:2021 Injection",
    "CWE-611": "A05:2021 Security Misconfiguration",
    "CWE-22": "A01:2021 Broken Access Control",
    "CWE-918": "A10:2021 SSRF",
    "CWE-502": "A08:2021 Software & Data Integrity Failures",
    "CWE-287": "A07:2021 Identification & Authentication Failures",
    "CWE-798": "A07:2021 Identification & Authentication Failures",
    "CWE-470": "A03:2021 Injection",
    "CWE-295": "A02:2021 Cryptographic Failures",
    "CWE-327": "A02:2021 Cryptographic Failures",
    "CWE-330": "A02:2021 Cryptographic Failures",
    "CWE-601": "A01:2021 Broken Access Control",
}


def owasp_for(cwe: str | None) -> str:
    return CWE_OWASP.get(cwe or "", "OWASP: uncategorized")


# Baseline severity per CWE for taint flows (a proven source→sink path).
CWE_SEVERITY: dict[str, str] = {
    "CWE-78": "critical",   # command injection
    "CWE-95": "critical",   # code execution (eval/exec)
    "CWE-94": "high",       # code/template injection
    "CWE-89": "high",       # SQL injection
    "CWE-502": "high",      # unsafe deserialization
    "CWE-918": "high",      # SSRF
    "CWE-22": "medium",     # path traversal
    "CWE-601": "medium",    # open redirect
}


def severity_for(cwe: str | None, sanitized: bool) -> str:
    """Severity for a taint flow. A sanitized path is downgraded to low."""
    if sanitized:
        return "low"
    return CWE_SEVERITY.get(cwe or "", "medium")
