"""
Recon execution backends.

Select via env RECON_EXECUTION_BACKEND = 'local' (default) | 'docker'.
"""
from __future__ import annotations

import os
from functools import lru_cache

from recon.runtime.base import Runner, RunSpec, RunResult, WORK_DIR  # noqa: F401
from recon.runtime.local import LocalRunner
from recon.runtime.docker import DockerRunner

_BACKENDS = {
    'local': LocalRunner,
    'docker': DockerRunner,
}


@lru_cache(maxsize=None)
def get_runner() -> Runner:
    """Return the configured execution backend (cached per process)."""
    backend = os.getenv('RECON_EXECUTION_BACKEND', 'local').strip().lower()
    cls = _BACKENDS.get(backend, LocalRunner)
    return cls()


def reset_runner_cache():
    """Test hook — clear the cached runner so env changes take effect."""
    get_runner.cache_clear()
