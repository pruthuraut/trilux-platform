"""
Core contract for every external-tool wrapper in the recon framework.

Design goals (per the refactor spec):
  - We *shell out* to real CLI tools (subfinder, httpx, naabu, nuclei, ...) rather
    than reimplementing them.
  - Every tool is wrapped as a `BaseTool` subclass exposing a uniform `run()` that
    returns a `ToolResult`.
  - Missing tools degrade gracefully (status = SKIPPED) instead of crashing the
    pipeline, so a partial toolbox still produces partial results.

Nothing here imports Django models or Celery, so wrappers can be unit-tested and
reused from the AI agent layer directly.
"""
from __future__ import annotations

import logging
import os
import shlex
import shutil
import tempfile
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Sequence, Union

logger = logging.getLogger('recon')


class ToolStatus(str, Enum):
    SUCCESS = 'success'      # ran and exited acceptably
    FAILED = 'failed'        # ran but errored / unacceptable exit code
    SKIPPED = 'skipped'      # binary not installed / disabled
    TIMEOUT = 'timeout'      # exceeded time budget
    EMPTY = 'empty'          # ran fine but produced no findings


@dataclass
class ToolResult:
    """Uniform return type for every tool invocation."""
    tool: str
    status: ToolStatus
    command: str = ''
    returncode: Optional[int] = None
    stdout: str = ''
    stderr: str = ''
    # Parsed, structured output (list of dicts is the common case).
    parsed: List[Dict[str, Any]] = field(default_factory=list)
    # Local files the tool produced (candidates for R2 upload).
    output_files: List[str] = field(default_factory=list)
    duration_s: float = 0.0
    error: str = ''
    meta: Dict[str, Any] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.status in (ToolStatus.SUCCESS, ToolStatus.EMPTY)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'tool': self.tool,
            'status': self.status.value,
            'command': self.command,
            'returncode': self.returncode,
            'parsed_count': len(self.parsed),
            'output_files': self.output_files,
            'duration_s': round(self.duration_s, 2),
            'error': self.error,
            'meta': self.meta,
        }


class BaseTool:
    """
    Base class for a CLI tool wrapper.

    Subclasses set `binary` and implement `build_command()` and (optionally)
    `parse_output()`. Everything else — availability detection, timeout handling,
    temp-file scratch space, structured errors — lives here.
    """

    #: Name of the executable expected on PATH (override in subclass).
    binary: str = ''
    #: Human-friendly name used in logs/results.
    name: str = ''
    #: Exit codes considered non-fatal (nuclei/gitleaks return 1 on findings).
    acceptable_returncodes: Sequence[int] = (0,)
    #: Default per-invocation timeout in seconds.
    default_timeout: int = 600
    #: Env vars to forward into the sandbox (e.g. API keys). Never the whole env.
    forward_env: Sequence[str] = ()

    def __init__(self, timeout: Optional[int] = None, extra_env: Optional[Dict[str, str]] = None):
        self.name = self.name or self.__class__.__name__
        self.timeout = timeout or self.default_timeout
        self.extra_env = extra_env or {}

    # ------------------------------------------------------------------ #
    # Availability
    # ------------------------------------------------------------------ #
    @classmethod
    def binary_path(cls) -> Optional[str]:
        """Resolve the tool binary on PATH (or an override env var TOOL_<NAME>)."""
        override = os.getenv(f'TOOL_{cls.binary.upper().replace("-", "_")}')
        if override and os.path.exists(override):
            return override
        return shutil.which(cls.binary) if cls.binary else None

    @classmethod
    def is_available(cls) -> bool:
        """
        Whether this tool can run under the configured execution backend.
        - LocalRunner : binary present on the worker's PATH.
        - DockerRunner: docker present (the toolbox image carries the binaries).
        Pure-Python checkers override this to return True.
        """
        from recon.runtime import get_runner
        return get_runner().is_tool_available(cls.binary)

    # ------------------------------------------------------------------ #
    # Hooks for subclasses
    # ------------------------------------------------------------------ #
    def build_command(self, target: str, **kwargs) -> List[str]:
        """Return argv list for this run. Must be overridden."""
        raise NotImplementedError

    def parse_output(self, result: ToolResult, **kwargs) -> List[Dict[str, Any]]:
        """
        Parse stdout / output files into structured records.
        Default: one record per non-empty stdout line.
        """
        lines = [ln.strip() for ln in result.stdout.splitlines() if ln.strip()]
        return [{'line': ln} for ln in lines]

    # ------------------------------------------------------------------ #
    # Execution
    # ------------------------------------------------------------------ #
    def run(self, target: str, **kwargs) -> ToolResult:
        import time

        if not self.is_available():
            logger.warning("Tool '%s' (%s) not installed — skipping.", self.name, self.binary)
            return ToolResult(
                tool=self.name,
                status=ToolStatus.SKIPPED,
                error=f"binary '{self.binary}' not found on PATH",
            )

        try:
            argv = self.build_command(target, **kwargs)
        except Exception as e:  # noqa: BLE001
            return ToolResult(tool=self.name, status=ToolStatus.FAILED,
                              error=f"failed to build command: {e}")

        from recon.runtime import get_runner, RunSpec, WORK_DIR

        command_str = ' '.join(shlex.quote(a) for a in argv)
        result = ToolResult(tool=self.name, status=ToolStatus.FAILED, command=command_str)

        runner = get_runner()
        spec = RunSpec(
            argv=argv,
            tool_name=self.name,
            binary=self.binary,
            timeout=kwargs.get('timeout', self.timeout),
            env=dict(self.extra_env),
            work_dir=WORK_DIR,
            forward_env=list(self.forward_env),
        )

        logger.info("[%s] running via %s: %s", self.name, runner.name, command_str)
        start = time.monotonic()
        run_result = runner.run(spec)
        result.duration_s = time.monotonic() - start

        if run_result.timed_out:
            result.status = ToolStatus.TIMEOUT
            result.error = run_result.error or f"timed out after {self.timeout}s"
            result.stdout = run_result.stdout
            logger.error("[%s] %s", self.name, result.error)
            return result

        if run_result.error and run_result.returncode is None:
            result.error = run_result.error
            logger.error("[%s] %s", self.name, result.error)
            return result

        result.returncode = run_result.returncode
        result.stdout = run_result.stdout
        result.stderr = run_result.stderr

        if run_result.returncode not in self.acceptable_returncodes:
            result.status = ToolStatus.FAILED
            result.error = f"exit code {run_result.returncode}: {result.stderr[:500]}"
            logger.error("[%s] failed (%s)", self.name, result.error)
            return result

        # Parse structured output.
        try:
            result.parsed = self.parse_output(result, **kwargs) or []
        except Exception as e:  # noqa: BLE001
            logger.warning("[%s] parse error: %s", self.name, e)
            result.parsed = []

        result.status = ToolStatus.SUCCESS if result.parsed else ToolStatus.EMPTY
        logger.info("[%s] done in %.1fs — %d records", self.name, result.duration_s, len(result.parsed))
        return result

    # ------------------------------------------------------------------ #
    # Helpers for subclasses
    # ------------------------------------------------------------------ #
    @staticmethod
    def scratch_file(suffix: str = '.txt') -> str:
        """
        Create a temp file path the tool can write to.

        Lives under the shared WORK_DIR so that, under DockerRunner, the file the
        tool writes inside its container is visible to the worker (same absolute
        path, bind-mounted) for output parsing.
        """
        from recon.runtime import WORK_DIR
        os.makedirs(WORK_DIR, exist_ok=True)
        fd, path = tempfile.mkstemp(suffix=suffix, prefix='recon_', dir=WORK_DIR)
        os.close(fd)
        return path

    @staticmethod
    def write_lines(lines: Sequence[str]) -> str:
        """Write lines to a temp file (e.g. an input list for httpx/naabu)."""
        path = BaseTool.scratch_file('.txt')
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        return path

    @staticmethod
    def read_json_lines(path: str) -> List[Dict[str, Any]]:
        """Parse a JSONL file (ProjectDiscovery tools emit one JSON obj per line)."""
        import json
        out: List[Dict[str, Any]] = []
        if not path or not os.path.exists(path):
            return out
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return out


# --------------------------------------------------------------------------- #
# Registry — lets the pipeline & AI agent discover/instantiate tools by name.
# --------------------------------------------------------------------------- #
_REGISTRY: Dict[str, type] = {}


def register_tool(key: str):
    """Decorator to register a BaseTool subclass under a short key."""
    def _wrap(cls):
        _REGISTRY[key] = cls
        cls.registry_key = key
        return cls
    return _wrap


def get_tool(key: str, **kwargs) -> Optional[BaseTool]:
    cls = _REGISTRY.get(key)
    return cls(**kwargs) if cls else None


def all_tools() -> Dict[str, type]:
    return dict(_REGISTRY)


def availability_report() -> Dict[str, bool]:
    """Map of registry key -> installed? — used by the /tools status endpoint."""
    report = {}
    for key, cls in _REGISTRY.items():
        try:
            report[key] = cls.is_available()
        except Exception:  # noqa: BLE001
            report[key] = False
    return report
