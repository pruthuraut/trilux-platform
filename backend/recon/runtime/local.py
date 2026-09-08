"""LocalRunner — runs the tool as a subprocess on the worker host (current behavior)."""
from __future__ import annotations

import os
import shutil
import subprocess

from recon.runtime.base import Runner, RunSpec, RunResult


class LocalRunner(Runner):
    name = 'local'

    def run(self, spec: RunSpec) -> RunResult:
        env = {**os.environ, **spec.env}
        try:
            proc = subprocess.run(
                spec.argv,
                capture_output=True,
                text=True,
                timeout=spec.timeout,
                env=env,
                check=False,
            )
        except subprocess.TimeoutExpired as e:
            out = e.stdout or ''
            if isinstance(out, bytes):
                out = out.decode(errors='ignore')
            return RunResult(timed_out=True, stdout=out,
                             error=f"timed out after {spec.timeout}s")
        except Exception as e:  # noqa: BLE001
            return RunResult(error=f"execution error: {e}")

        return RunResult(returncode=proc.returncode,
                         stdout=proc.stdout or '', stderr=proc.stderr or '')

    def is_tool_available(self, binary: str) -> bool:
        if not binary:
            return False
        override = os.getenv(f'TOOL_{binary.upper().replace("-", "_")}')
        if override and os.path.exists(override):
            return True
        return shutil.which(binary) is not None
