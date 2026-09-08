"""
DockerRunner — runs each tool invocation in an ephemeral, hardened container.

Model: Docker-outside-of-Docker (DooD). The Celery worker has the host docker
socket mounted and shells out to `docker run --rm <toolbox-image> <argv>`. The
tool binary therefore executes in a throwaway container, NOT on the worker host.

Hardening applied to every spawned container:
  --rm                         auto-remove on exit (no leftover state)
  --network <scan net>         dedicated bridge, isolated from app/internal services
  --cap-drop ALL               no Linux capabilities
  --security-opt no-new-privileges
  --read-only                  immutable root filesystem
  --tmpfs /tmp                 writable scratch in RAM
  --pids-limit / --memory / --cpus   resource caps (fork-bomb / OOM protection)
  --user <uid>                 non-root
  -v <work_dir>:<work_dir>     shared work dir at the SAME path (so output files
                               written by the tool are readable by the worker)

Egress: the scan network is created (compose / setup) as an internal-isolated
bridge that can reach the public internet but NOT RFC1918 / link-local metadata.
See docker-compose + docs; this runner just attaches to RECON_SCAN_NETWORK.
"""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
from typing import List

from recon.runtime.base import Runner, RunSpec, RunResult

logger = logging.getLogger('recon')

# Config (env-driven so compose/k8s can tune without code changes).
TOOLBOX_IMAGE = os.getenv('RECON_TOOLBOX_IMAGE', 'trilux-toolbox:latest')
SCAN_NETWORK = os.getenv('RECON_SCAN_NETWORK', 'trilux_scan_net')
DOCKER_BIN = os.getenv('RECON_DOCKER_BIN', 'docker')
CONTAINER_USER = os.getenv('RECON_CONTAINER_USER', '1000:1000')
MEM_LIMIT = os.getenv('RECON_CONTAINER_MEM', '1g')
CPU_LIMIT = os.getenv('RECON_CONTAINER_CPUS', '1.0')
PIDS_LIMIT = os.getenv('RECON_CONTAINER_PIDS', '512')
# docker run start overhead is added to the tool's own timeout budget.
DOCKER_OVERHEAD_S = int(os.getenv('RECON_DOCKER_OVERHEAD_S', '30'))


class DockerRunner(Runner):
    name = 'docker'

    def _docker_available(self) -> bool:
        return shutil.which(DOCKER_BIN) is not None

    def _network_arg(self) -> List[str]:
        """
        Use the isolated scan network if it exists; create it on first use; if
        creation fails (e.g. permissions), fall back to the default bridge so a
        locally-run dev server still works without `docker compose up`.
        """
        if not SCAN_NETWORK:
            return []
        try:
            check = subprocess.run([DOCKER_BIN, 'network', 'inspect', SCAN_NETWORK],
                                   capture_output=True, timeout=15)
            if check.returncode != 0:
                subprocess.run([DOCKER_BIN, 'network', 'create', SCAN_NETWORK],
                               capture_output=True, timeout=30)
            return ['--network', SCAN_NETWORK]
        except Exception as e:  # noqa: BLE001
            logger.warning("scan network %s unavailable (%s); using default bridge",
                           SCAN_NETWORK, e)
            return []

    def _base_run_args(self, spec: RunSpec) -> List[str]:
        """Assemble the hardened `docker run ...` prefix (before image + argv)."""
        args = [DOCKER_BIN, 'run', '--rm']
        args += self._network_arg()
        args += [
            '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges',
            '--read-only',
            '--pids-limit', str(PIDS_LIMIT),
            '--memory', MEM_LIMIT,
            '--cpus', str(CPU_LIMIT),
            '--user', CONTAINER_USER,
            # Shared work dir at the same absolute path inside the container, so
            # output files the tool writes are readable back on the host.
            '-v', f'{spec.work_dir}:{spec.work_dir}:rw',
            '-w', spec.work_dir,
        ]
        # Give the read-only rootfs writable scratch areas. /tmp unless the work
        # dir already lives there (a tmpfs at the work dir would shadow the bind
        # mount and lose output). /home/scanner so tools that write config there
        # (nuclei ~/.config/nuclei, subfinder provider config) don't fail on the
        # read-only rootfs.
        if spec.work_dir.rstrip('/') != '/tmp':
            args += ['--tmpfs', '/tmp:rw,nosuid,size=512m,mode=1777']
        # mode=1777 so the non-root container user (uid 1000) can create its tool
        # config dirs (~/.config/subfinder, ~/.config/nuclei) on the read-only rootfs.
        args += ['--tmpfs', '/home/scanner:rw,nosuid,size=256m,mode=1777']
        # Forward only explicitly whitelisted env vars (e.g. API keys), never the
        # worker's whole environment (which holds DB creds, R2 keys, etc.).
        for key in spec.forward_env:
            val = os.environ.get(key)
            if val is not None:
                args += ['-e', f'{key}={val}']
        for key, val in spec.env.items():
            args += ['-e', f'{key}={val}']
        return args

    def run(self, spec: RunSpec) -> RunResult:
        if not self._docker_available():
            return RunResult(error=f"docker binary '{DOCKER_BIN}' not found on worker")

        # The tool binary is the entrypoint inside the toolbox image; we override
        # the entrypoint to the requested binary and pass its args.
        cmd = self._base_run_args(spec)
        cmd += ['--entrypoint', spec.binary, TOOLBOX_IMAGE]
        cmd += spec.argv[1:]  # argv[0] is the binary name; entrypoint already set

        logger.info("[docker] %s", ' '.join(cmd))
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=spec.timeout + DOCKER_OVERHEAD_S,
                check=False,
            )
        except subprocess.TimeoutExpired as e:
            out = e.stdout or ''
            if isinstance(out, bytes):
                out = out.decode(errors='ignore')
            return RunResult(timed_out=True, stdout=out,
                             error=f"container timed out after {spec.timeout}s")
        except Exception as e:  # noqa: BLE001
            return RunResult(error=f"docker execution error: {e}")

        return RunResult(returncode=proc.returncode,
                         stdout=proc.stdout or '', stderr=proc.stderr or '')

    def is_tool_available(self, binary: str) -> bool:
        """
        Under DockerRunner, tool availability == the toolbox image is present.
        We don't probe each binary individually (that'd cost a container spawn);
        the toolbox image is built to contain them all. If docker itself is
        missing, nothing is available.
        """
        return bool(binary) and self._docker_available()
