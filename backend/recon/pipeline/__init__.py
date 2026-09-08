"""
Recon domain pipeline.

Importing this package registers all 12 steps (via @register_step) so the
orchestrator can enumerate them in order with pipeline_steps().
"""
from recon.pipeline.base import (  # noqa: F401
    PipelineContext,
    Step,
    StepOutcome,
    pipeline_steps,
)
from recon.pipeline import steps  # noqa: F401  (registration side effects)
