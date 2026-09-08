"""
Fingerprinting, dedup, and repo-local suppression for taint findings.

Three mechanisms, all deterministic and independent of the DB layer:

  * fingerprint()      — a stable, path/line-independent id for a finding, so it
                         keeps its identity across line shifts, file moves and
                         re-scans (used as the key for dedup, baseline and triage).
  * dedup_findings()   — collapse findings that share a fingerprint (the same
                         logical vuln appearing in vendored/shared copies) into a
                         single record carrying every occurrence.
  * apply_inline_and_baseline() — honour inline `# nosec` markers on the sink/source
                         line and a repo-root baseline file (.sast-baseline.json /
                         .sastignore) listing fingerprints to suppress.
"""
from __future__ import annotations

import hashlib
import json
import os
import re

BASELINE_FILENAMES = (".sast-baseline.json", ".sastignore")

# Matches `# nosec`, `// nosec`, optionally scoped to CWEs: `# nosec CWE-89,CWE-78`.
_NOSEC_RE = re.compile(r"(?:#|//)\s*nosec\b(?P<cwes>[^\n]*)", re.IGNORECASE)
_CWE_RE = re.compile(r"CWE-\d+", re.IGNORECASE)


def normalize_code(line: str) -> str:
    """Normalize a source line for fingerprinting: drop trailing comments/nosec,
    collapse whitespace, and mask string/number literals so cosmetic edits (a
    renamed literal, reflowed spacing, an added comment) don't change identity."""
    if not line:
        return ""
    s = line
    # Strip an inline comment (best-effort; keeps `#` inside quotes rare enough).
    for marker in ("#", "//"):
        idx = s.find(marker)
        if idx != -1:
            s = s[:idx]
    s = s.strip()
    # Mask string literals and numbers.
    s = re.sub(r"""(['"]).*?\1""", "S", s)
    s = re.sub(r"\b\d+(?:\.\d+)?\b", "N", s)
    # Collapse whitespace.
    s = re.sub(r"\s+", " ", s)
    return s


def _line_at(files: dict[str, str], rel_path: str, line_no: int) -> str:
    content = files.get(rel_path)
    if content is None:
        return ""
    lines = content.splitlines()
    if 1 <= line_no <= len(lines):
        return lines[line_no - 1]
    return ""


def fingerprint(cwe: str, sink_name: str, sink_code_norm: str, func_short: str) -> str:
    """Stable id from vuln class + sink + normalized sink code + short function
    name. Deliberately excludes file path and line number so the same finding is
    recognized after moves/edits and across duplicate copies."""
    basis = "|".join([cwe or "", sink_name or "", sink_code_norm or "", func_short or ""])
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()[:16]


def _short_func(function_gid: str) -> str:
    """Last one/two segments of a global function id ('pkg.mod.Cls.method' ->
    'Cls.method') — stable when a module is moved/renamed."""
    if not function_gid:
        return ""
    parts = function_gid.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else parts[-1]


def annotate_fingerprints(findings: list[dict], files: dict[str, str]) -> None:
    """Attach `fingerprint` and `sink_code` to each finding, in place."""
    for f in findings:
        sink_line_text = _line_at(files, f.get("sink_file", ""), f.get("sink_line", 0))
        norm = normalize_code(sink_line_text)
        f["sink_code"] = sink_line_text.strip()
        f["fingerprint"] = fingerprint(
            f.get("cwe", ""), f.get("sink", ""), norm, _short_func(f.get("function", "")),
        )


def _nosec_cwes(line: str) -> tuple[bool, set[str]]:
    """Return (has_nosec, cwe_scope). Empty scope means 'suppress any CWE'."""
    m = _NOSEC_RE.search(line or "")
    if not m:
        return False, set()
    cwes = {c.upper() for c in _CWE_RE.findall(m.group("cwes") or "")}
    return True, cwes


def _inline_suppressed(f: dict, files: dict[str, str]) -> bool:
    """A `# nosec` on the sink line (or the source line) suppresses the finding.
    If the marker names CWEs, it only suppresses those."""
    cwe = (f.get("cwe") or "").upper()
    for path, ln in ((f.get("sink_file"), f.get("sink_line")),
                     (f.get("source_file"), f.get("source_line"))):
        if not path or not ln:
            continue
        has, scope = _nosec_cwes(_line_at(files, path, ln))
        if has and (not scope or cwe in scope):
            return True
    return False


def load_baseline(scan_root: str) -> set[str]:
    """Read a repo-root baseline of fingerprints to suppress. Supports
    `.sast-baseline.json` (a JSON list, or {"fingerprints": [...]}) and
    `.sastignore` (one fingerprint per line, `#` comments allowed)."""
    fps: set[str] = set()
    for name in BASELINE_FILENAMES:
        path = os.path.join(scan_root, name)
        if not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                raw = fh.read()
        except OSError:
            continue
        if name.endswith(".json"):
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            items = data.get("fingerprints", []) if isinstance(data, dict) else data
            for it in items or []:
                if isinstance(it, str):
                    fps.add(it.strip())
                elif isinstance(it, dict) and it.get("fingerprint"):
                    fps.add(str(it["fingerprint"]).strip())
        else:
            for line in raw.splitlines():
                line = line.split("#", 1)[0].strip()
                if line:
                    fps.add(line)
    return fps


def apply_inline_and_baseline(findings: list[dict], files: dict[str, str],
                              scan_root: str) -> None:
    """Mark findings suppressed by an inline `# nosec` or the repo baseline file.
    Sets `suppressed` (bool) and `suppression_source` ('nosec'|'baseline'|'')."""
    baseline = load_baseline(scan_root)
    for f in findings:
        if _inline_suppressed(f, files):
            f["suppressed"] = True
            f["suppression_source"] = "nosec"
        elif f.get("fingerprint") in baseline:
            f["suppressed"] = True
            f["suppression_source"] = "baseline"
        else:
            f.setdefault("suppressed", False)
            f.setdefault("suppression_source", "")


def dedup_findings(findings: list[dict]) -> list[dict]:
    """Collapse findings sharing a fingerprint into one representative that keeps
    the full occurrence list. Preserves input order (already severity-sorted)."""
    by_fp: dict[str, dict] = {}
    order: list[str] = []
    for f in findings:
        fp = f.get("fingerprint")
        if fp is None:
            fp = f"_noid_{id(f)}"
        occ = {"sink_file": f.get("sink_file"), "sink_line": f.get("sink_line"),
               "source_file": f.get("source_file"), "source_line": f.get("source_line")}
        if fp in by_fp:
            rep = by_fp[fp]
            rep["occurrences"].append(occ)
            rep["occurrence_count"] = len(rep["occurrences"])
            # A concrete location (not suppressed) should win as the representative.
            if rep.get("suppressed") and not f.get("suppressed"):
                merged_occ = rep["occurrences"]
                by_fp[fp] = {**f, "occurrences": merged_occ,
                             "occurrence_count": len(merged_occ)}
        else:
            rep = {**f, "occurrences": [occ], "occurrence_count": 1}
            by_fp[fp] = rep
            order.append(fp)
    return [by_fp[fp] for fp in order]
