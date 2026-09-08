"""
Pluggable AI layer for recon.

Powers /ai (free-form analysis), /brain (deep run analysis), and agent modes.

The provider is selected by env RECON_AI_PROVIDER (default: 'bedrock'):

  openrouter  — OpenRouter HTTP API, OPENROUTER_API_KEY (free model by default)
  anthropic   — Anthropic API directly, ANTHROPIC_API_KEY
  bedrock     — Claude on Amazon Bedrock, reusing the machine's existing AWS / Claude
                Code Bedrock setup (no Anthropic key needed; creds come from the
                standard AWS chain — env, profile, SSO, instance role)
  gemini      — Google Gemini (reuses api.helpers.llm_helper.call_gemini_sdk)

`call_ai()` tries the selected provider first, then falls back through the others
that are configured, so a missing key for one provider degrades gracefully instead
of failing the whole feature.
"""
from __future__ import annotations

import logging
import os
from typing import List, Optional

import requests

from trilux.config import Config as config

logger = logging.getLogger('recon')

OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
DEFAULT_OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'stepfun/step-3.5-flash:free')

# Anthropic model defaults. Bedrock IDs differ from first-party IDs (region-scoped
# inference-profile IDs), so each provider has its own default + env override.
DEFAULT_ANTHROPIC_MODEL = os.getenv('ANTHROPIC_RECON_MODEL', 'claude-opus-4-8')
DEFAULT_BEDROCK_MODEL = os.getenv('BEDROCK_RECON_MODEL', 'us.anthropic.claude-opus-4-8')
ANTHROPIC_MAX_TOKENS = int(os.getenv('RECON_AI_MAX_TOKENS', '4096'))


def _env(name: str, attr: Optional[str] = None) -> Optional[str]:
    return os.getenv(name) or (getattr(config, attr, None) if attr else None)


# --------------------------------------------------------------------------- #
# Provider: OpenRouter
# --------------------------------------------------------------------------- #
def call_openrouter(prompt: str, model: Optional[str] = None,
                    system: Optional[str] = None, timeout: int = 120) -> str:
    api_key = _env('OPENROUTER_API_KEY', 'OPENROUTER_API_KEY')
    if not api_key:
        raise RuntimeError('OPENROUTER_API_KEY not set')

    messages = []
    if system:
        messages.append({'role': 'system', 'content': system})
    messages.append({'role': 'user', 'content': prompt})

    resp = requests.post(
        OPENROUTER_URL,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': os.getenv('OPENROUTER_REFERER', 'https://obsedian.guard'),
            'X-Title': 'Obsedian Guard Recon',
        },
        json={'model': model or DEFAULT_OPENROUTER_MODEL, 'messages': messages},
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json()['choices'][0]['message']['content']


# --------------------------------------------------------------------------- #
# Provider: Anthropic API (direct, with API key)
# --------------------------------------------------------------------------- #
def _anthropic_text(message) -> str:
    """Extract the concatenated text blocks from an Anthropic Message."""
    return ''.join(b.text for b in message.content if getattr(b, 'type', None) == 'text')


def call_anthropic(prompt: str, model: Optional[str] = None,
                   system: Optional[str] = None) -> str:
    import anthropic  # imported lazily so the dep is optional
    api_key = _env('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError('ANTHROPIC_API_KEY not set')
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model=model or DEFAULT_ANTHROPIC_MODEL,
        max_tokens=ANTHROPIC_MAX_TOKENS,
        system=system or anthropic.NOT_GIVEN,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return _anthropic_text(msg)


# --------------------------------------------------------------------------- #
# Provider: Claude on Amazon Bedrock (reuses existing AWS / Claude Code setup)
# --------------------------------------------------------------------------- #
def _bedrock_client():
    """
    Build a Bedrock-backed Anthropic client. Credentials come from the standard
    AWS chain (env vars, shared profile, SSO, instance role) — the same setup
    Claude Code uses when CLAUDE_CODE_USE_BEDROCK=1 — so no Anthropic key is needed.

    Defaults to the legacy AnthropicBedrock client, which uses the standard
    `bedrock-runtime:InvokeModel` API that Claude Code's Bedrock mode relies on
    (and that most IAM policies already grant). Set RECON_BEDROCK_USE_MANTLE=1 to
    use the newer Mantle endpoint instead (requires bedrock-mantle:* permissions).
    """
    import anthropic
    region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
    use_mantle = os.getenv('RECON_BEDROCK_USE_MANTLE', '').strip().lower() in ('1', 'true', 'yes')
    if use_mantle and hasattr(anthropic, 'AnthropicBedrockMantle'):
        return anthropic.AnthropicBedrockMantle(aws_region=region)
    return anthropic.AnthropicBedrock(aws_region=region)


def call_bedrock(prompt: str, model: Optional[str] = None,
                 system: Optional[str] = None) -> str:
    import anthropic  # for NOT_GIVEN sentinel
    client = _bedrock_client()
    msg = client.messages.create(
        model=model or DEFAULT_BEDROCK_MODEL,
        max_tokens=ANTHROPIC_MAX_TOKENS,
        system=system or anthropic.NOT_GIVEN,
        messages=[{'role': 'user', 'content': prompt}],
    )
    return _anthropic_text(msg)


# --------------------------------------------------------------------------- #
# Provider: Gemini
# --------------------------------------------------------------------------- #
def call_gemini(prompt: str, system: Optional[str] = None) -> str:
    from api.helpers.llm_helper import call_gemini_sdk
    full = f"{system}\n\n{prompt}" if system else prompt
    return call_gemini_sdk(full)


# --------------------------------------------------------------------------- #
# Dispatch + fallback
# --------------------------------------------------------------------------- #
_PROVIDERS = {
    'openrouter': call_openrouter,
    'anthropic': lambda prompt, model=None, system=None: call_anthropic(prompt, model, system),
    'bedrock': lambda prompt, model=None, system=None: call_bedrock(prompt, model, system),
    'gemini': lambda prompt, model=None, system=None: call_gemini(prompt, system),
}

# Fallback order after the selected provider (deduped, selected one first).
_FALLBACK_ORDER = ['bedrock', 'openrouter', 'anthropic', 'gemini']


def _provider_order() -> List[str]:
    selected = os.getenv('RECON_AI_PROVIDER', 'bedrock').strip().lower()
    order = [selected] + [p for p in _FALLBACK_ORDER if p != selected]
    # keep only known providers
    return [p for p in order if p in _PROVIDERS]


def call_ai(prompt: str, system: Optional[str] = None, model: Optional[str] = None) -> str:
    """
    Provider-agnostic entrypoint. Tries the configured provider, then falls back
    through the rest. Raises RuntimeError only if every provider fails.
    """
    errors = []
    for name in _provider_order():
        fn = _PROVIDERS[name]
        try:
            # `model` is provider-specific; only pass it to the primary provider so
            # a caller-supplied OpenRouter model id isn't sent to Bedrock, etc.
            if name == os.getenv('RECON_AI_PROVIDER', 'bedrock').strip().lower():
                return fn(prompt, model=model, system=system)
            return fn(prompt, system=system)
        except Exception as e:  # noqa: BLE001
            errors.append(f'{name}: {e}')
            logger.warning('AI provider %s failed: %s', name, e)
    logger.error('All AI providers failed: %s', errors)
    raise RuntimeError(f'AI providers failed: {"; ".join(errors)}')


# --------------------------------------------------------------------------- #
# Analysis helpers used by /ai and /brain
# --------------------------------------------------------------------------- #
SUMMARY_SYSTEM = (
    "You are a senior offensive-security analyst. Given recon/scan findings, produce "
    "a concise, prioritized summary: highlight the most severe and actionable issues "
    "first, group by host where useful, and suggest concrete next steps. Be specific."
)


def summarize_findings(target: str, findings: List[dict]) -> str:
    """/brain — analyze a finished run's findings into a prioritized summary."""
    import json
    sample = findings[:400]
    prompt = (
        f"Target: {target}\n"
        f"Total findings: {len(findings)} (showing {len(sample)}).\n\n"
        f"Findings JSON:\n{json.dumps(sample, default=str)[:60000]}\n\n"
        "Write the prioritized security summary."
    )
    try:
        return call_ai(prompt, system=SUMMARY_SYSTEM)
    except Exception as e:  # noqa: BLE001
        return f"(AI summary unavailable: {e})"
