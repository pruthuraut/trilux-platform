"""Collect Python source files from a project directory into {rel_path: content}."""
from __future__ import annotations

import os

SKIP_DIRS = {
    ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build",
    ".mypy_cache", ".pytest_cache", "site-packages", ".idea", ".vscode",
    "vendor", "target", ".next", "migrations",
}
MAX_FILE_BYTES = 1_500_000


def collect_python_files(root: str, max_files: int = 2000) -> dict[str, str]:
    """Walk `root` and return {relative_path: content} for every .py file,
    skipping vendored/build dirs and oversized files."""
    out: dict[str, str] = {}
    root = os.path.abspath(root)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(".py"):
                continue
            full = os.path.join(dirpath, fn)
            try:
                if os.path.getsize(full) > MAX_FILE_BYTES:
                    continue
                with open(full, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except OSError:
                continue
            rel = os.path.relpath(full, root)
            out[rel] = content
            if len(out) >= max_files:
                return out
    return out
