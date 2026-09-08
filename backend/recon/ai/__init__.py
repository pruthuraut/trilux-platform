"""Recon AI layer — pluggable provider (OpenRouter / Anthropic / Bedrock / Gemini)."""
from recon.ai.client import (  # noqa: F401
    call_ai,
    call_openrouter,
    call_anthropic,
    call_bedrock,
    call_gemini,
    summarize_findings,
)
