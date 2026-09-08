"""Shared helpers for tool wrappers."""
from __future__ import annotations

from typing import Optional

_SEVERITY_MAP = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'moderate': 'medium',
    'low': 'low',
    'info': 'info',
    'informational': 'info',
    'unknown': 'unknown',
}


def normalize_severity(value: Optional[str]) -> str:
    """Map arbitrary tool severity strings onto recon.models.Severity values."""
    if not value:
        return 'unknown'
    return _SEVERITY_MAP.get(str(value).strip().lower(), 'unknown')


def strip_scheme(host: str) -> str:
    """example.com from https://example.com:443/path"""
    h = host.split('://', 1)[-1]
    h = h.split('/', 1)[0]
    h = h.split(':', 1)[0]
    return h.strip()
