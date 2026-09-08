"""
Execution-backend abstraction for recon tools.

A `Runner` takes a `RunSpec` (argv + env + timeout + the shared work dir the tool
needs) and returns a `RunResult` (returncode/stdout/stderr/timeout). This decouples
*what command to run* (the BaseTool wrappers) from *where it runs*:

  - LocalRunner  : subprocess on the worker host (dev / trusted single host)
  - DockerRunner : ephemeral hardened container per invocation (DooD)

The key contract that lets DockerRunner work without changing any wrapper: every
tool's scratch/output files live under a single WORK_DIR that is mounted into the
spawned container at the *same absolute path*, so an argv like `-o /recon-work/x.json`
resolves identically inside the container and back on the worker that parses it.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# Shared work dir. Under docker-compose this is a named volume mounted at the same
# path in the worker AND every spawned tool container. Locally it's just a tmp dir.
WORK_DIR = os.getenv('RECON_WORK_DIR', '/tmp')


@dataclass
class RunSpec:
    argv: List[str]
    tool_name: str
    binary: str
    timeout: int
    env: Dict[str, str] = field(default_factory=dict)
    # Absolute dir the tool reads/writes (mounted into the container at same path).
    work_dir: str = WORK_DIR
    # Names of env vars to forward into the sandbox (e.g. SUBFINDER API keys).
    forward_env: List[str] = field(default_factory=list)


@dataclass
class RunResult:
    returncode: Optional[int] = None
    stdout: str = ''
    stderr: str = ''
    timed_out: bool = False
    error: str = ''


class Runner:
    """Abstract execution backend."""

    name = 'base'

    def run(self, spec: RunSpec) -> RunResult:
        raise NotImplementedError

    def is_tool_available(self, binary: str) -> bool:
        """Whether `binary` can be executed by this backend."""
        raise NotImplementedError
