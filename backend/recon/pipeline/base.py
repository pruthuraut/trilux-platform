"""
Pipeline step contract.

Each of the 12 domain-recon steps is a `Step` subclass. A step:
  - reads inputs from the shared `PipelineContext` (e.g. live hosts from step 2),
  - shells out to one or more tools (via the recon.tools registry),
  - persists a StepResult + Findings,
  - uploads its primary artifact to R2,
  - writes outputs back into the context for downstream steps.

The orchestrator (recon/tasks.py) runs steps in order, tolerating skipped/failed
steps so a partial toolbox still yields partial results.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger('recon')


@dataclass
class PipelineContext:
    """Shared state threaded through all steps of a domain run."""
    run_uuid: str
    target: str                      # root domain, e.g. example.com
    options: Dict[str, Any] = field(default_factory=dict)

    # Accumulated artifacts (lists of strings/dicts) keyed by logical name.
    subdomains: List[str] = field(default_factory=list)
    live_hosts: List[str] = field(default_factory=list)      # e.g. https://x.example.com
    open_ports: Dict[str, List[int]] = field(default_factory=dict)
    tech: Dict[str, List[str]] = field(default_factory=dict)
    urls: List[str] = field(default_factory=list)
    js_files: List[str] = field(default_factory=list)

    # storage helper is injected by the orchestrator
    storage: Any = None

    def get_option(self, key: str, default=None):
        return self.options.get(key, default)


@dataclass
class StepOutcome:
    step_key: str
    tool: str
    status: str                       # maps to models.StepStatus
    records: List[Dict[str, Any]] = field(default_factory=list)
    findings: List[Dict[str, Any]] = field(default_factory=list)   # normalized Finding kwargs
    artifact_path: Optional[str] = None      # local file to upload to R2
    artifact_name: Optional[str] = None
    command: str = ''
    duration_s: float = 0.0
    error: str = ''


class Step:
    """Base class for a pipeline step."""

    number: int = 0
    key: str = ''
    title: str = ''

    def __init__(self, ctx: PipelineContext):
        self.ctx = ctx

    def run(self) -> StepOutcome:
        """Execute the step. Must be overridden."""
        raise NotImplementedError

    # convenience -------------------------------------------------------- #
    def _outcome(self, **kwargs) -> StepOutcome:
        kwargs.setdefault('step_key', self.key)
        return StepOutcome(**kwargs)


# Ordered registry of the 12 domain-pipeline steps.
_PIPELINE_STEPS: List[type] = []


def register_step(cls):
    _PIPELINE_STEPS.append(cls)
    return cls


def pipeline_steps() -> List[type]:
    """Steps sorted by their declared number."""
    return sorted(_PIPELINE_STEPS, key=lambda c: c.number)
