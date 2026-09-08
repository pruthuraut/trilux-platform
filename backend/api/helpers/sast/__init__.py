"""Cross-file, repo-wide taint SAST engine (Python, deterministic, no LLM)."""
from .taint_engine import analyze_project, Flow
from .collector import collect_python_files
from .knowledge import owasp_for, severity_for
from .suppression import (
    annotate_fingerprints, apply_inline_and_baseline, dedup_findings,
)

__all__ = [
    "analyze_project", "Flow", "collect_python_files", "owasp_for", "severity_for",
    "scan_repo",
]


def scan_repo(scan_root: str, triage: dict | None = None) -> dict:
    """
    Run cross-file taint SAST over a project directory and return a structured
    result with dedup, suppression and triage applied.

    triage: optional {fingerprint: {"status": "false_positive"|"accepted_risk"|
            "wont_fix"|"open", "note": str}} — persistent decisions from prior
            scans (see recorded triage in the DB). A non-open status suppresses
            the finding from the active count but keeps it visible + labelled.

    Returns:
        {
          "findings":  [...],          # deduped, each with fingerprint/occurrences
          "active":    [...],          # subset that is neither suppressed nor triaged-away
          "summary":   {sev: n},       # counts over ACTIVE findings only
          "total": int, "active_total": int, "suppressed_total": int,
          "cross_file": int,
        }
    """
    triage = triage or {}
    files = collect_python_files(scan_root)
    flows = analyze_project(files)

    findings: list[dict] = []
    for f in flows:
        findings.append({
            "cwe": f.cwe,
            "owasp": owasp_for(f.cwe),
            "severity": severity_for(f.cwe, f.sanitized),
            "sink": f.sink_name,
            "title": f"{f.label} via tainted input",
            "source_file": f.source_file,
            "source_line": f.source_line,
            "sink_file": f.sink_file,
            "sink_line": f.sink_line,
            "function": f.function,
            "cross_file": f.cross_file,
            "interprocedural": f.interprocedural,
            "sanitized": f.sanitized,
            "confidence": round(f.confidence, 2),
            "taint_path": f.path,
            "source_desc": f.source_desc,
        })

    # 1. Stable fingerprints (identity across line shifts / moves / re-scans).
    annotate_fingerprints(findings, files)
    # 2. Inline `# nosec` + repo baseline-file suppression.
    apply_inline_and_baseline(findings, files, scan_root)
    # 3. Dedup vendored/shared copies into one finding + occurrence list.
    findings = dedup_findings(findings)

    # 4. Persistent triage decisions (DB-backed) keyed by fingerprint.
    for f in findings:
        decision = triage.get(f.get("fingerprint"))
        if decision and decision.get("status") and decision["status"] != "open":
            f["triage_status"] = decision["status"]
            f["triage_note"] = decision.get("note", "")
        else:
            f.setdefault("triage_status", "open")
            f.setdefault("triage_note", "")

    # Most severe / highest confidence first.
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda x: (order.get(x["severity"], 9), -x["confidence"]))

    def _is_active(f: dict) -> bool:
        return not f.get("suppressed") and f.get("triage_status", "open") == "open"

    active = [f for f in findings if _is_active(f)]
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in active:
        sev = (f.get("severity") or "").lower()
        if sev in summary:
            summary[sev] += 1

    return {
        "findings": findings,
        "active": active,
        "summary": summary,
        "total": len(findings),
        "active_total": len(active),
        "suppressed_total": len(findings) - len(active),
        "cross_file": sum(1 for f in active if f.get("cross_file")),
    }
