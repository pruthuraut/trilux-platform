"""
Core SCA logic for the web app.
Refactored from sca_tool.py to use nvdlib and support web usage.
"""

from __future__ import annotations

import json
import logging
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import nvdlib

# --- Domain models ---------------------------------------------------------

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


class LicenseRisk(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


@dataclass
class Vulnerability:
    cve_id: str
    severity: Severity
    description: str
    cvss_score: float = 0.0
    fixed_version: Optional[str] = None


@dataclass
class License:
    name: str
    spdx_id: str
    risk: LicenseRisk


@dataclass
class Dependency:
    name: str
    version: str
    package_manager: str
    license: Optional[License] = None
    vulnerabilities: List[Vulnerability] = field(default_factory=list)
    direct: bool = True
    deprecated: bool = False

    @property
    def risk_score(self) -> float:
        score = 0.0
        for v in self.vulnerabilities:
            if v.severity == Severity.CRITICAL:
                score += 2.0
            elif v.severity == Severity.HIGH:
                score += 1.5
            elif v.severity == Severity.MEDIUM:
                score += 1.0
            elif v.severity == Severity.LOW:
                score += 0.5
        if self.license and self.license.risk == LicenseRisk.HIGH:
            score += 2.0
        if self.deprecated:
            score += 1.0
        return min(score, 10.0)


@dataclass
class SCAResult:
    project_name: str
    scan_date: str = field(default_factory=lambda: datetime.now().isoformat())
    dependencies: List[Dependency] = field(default_factory=list)
    execution_time: float = 0.0

    def calculate_stats(self) -> Dict[str, int]:
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for d in self.dependencies:
            for v in d.vulnerabilities:
                if v.severity == Severity.CRITICAL:
                    counts["critical"] += 1
                elif v.severity == Severity.HIGH:
                    counts["high"] += 1
                elif v.severity == Severity.MEDIUM:
                    counts["medium"] += 1
                elif v.severity == Severity.LOW:
                    counts["low"] += 1
        return counts


# --- Simple in-memory "databases" / stubs ---------------------------------

class LicenseDatabase:
    LICENSES: Dict[str, License] = {
        "MIT": License("MIT License", "MIT", LicenseRisk.LOW),
        "Apache-2.0": License("Apache License 2.0", "Apache-2.0", LicenseRisk.LOW),
    }

    @staticmethod
    def get_license(spdx: str) -> Optional[License]:
        return LicenseDatabase.LICENSES.get(spdx)


class VulnerabilityDatabase:
    """Dynamic vulnerability database that queries OSV and NVD APIs."""

    OSV_API = "https://api.osv.dev/v1/query"
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.cache: Dict[str, List[Vulnerability]] = {}

    def check_vulnerabilities(self, package_name: str, version: str, ecosystem: str) -> List[Vulnerability]:
        """Check for vulnerabilities by querying OSV API."""
        cache_key = f"{ecosystem}:{package_name}:{version}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        vulns = []
        
        # Map package managers to OSV ecosystem names
        ecosystem_map = {
            "npm": "npm",
            "pip": "PyPI",
            "maven": "Maven",
            "docker": "Docker"
        }
        
        osv_ecosystem = ecosystem_map.get(ecosystem, ecosystem)
        
        # Try OSV API first
        try:
            vulns = self._query_osv(package_name, version, osv_ecosystem)
        except Exception as e:
            self.logger.warning(f"OSV API failed for {package_name}: {e}")
        
        # Fallback to NVD if OSV fails or returns nothing
        if not vulns:
            try:
                vulns = self._query_nvd(package_name, version)
            except Exception as e:
                self.logger.warning(f"NVD API failed for {package_name}: {e}")
        
        self.cache[cache_key] = vulns
        return vulns

    def _query_osv(self, package_name: str, version: str, ecosystem: str) -> List[Vulnerability]:
        """Query the OSV (Open Source Vulnerabilities) database."""
        payload = {
            "package": {"name": package_name, "ecosystem": ecosystem},
            "version": version
        }
        
        try:
            req = urllib.request.Request(
                self.OSV_API,
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"}
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
            
            vulns = []
            for vuln in data.get("vulns", []):
                severity = self._infer_severity(vuln)
                cvss_score = self._extract_cvss(vuln)
                fixed_version = self._extract_fixed_version(vuln)

                vulns.append(Vulnerability(
                    cve_id=self._preferred_id(vuln),
                    severity=severity,
                    description=self._extract_description(vuln),
                    cvss_score=cvss_score,
                    fixed_version=fixed_version
                ))

            return vulns
        except Exception as e:
            self.logger.debug(f"OSV API request failed: {e}")
            return []

    def _query_nvd(self, package_name: str, version: str) -> List[Vulnerability]:
        """Query the NVD using nvdlib."""
        try:
            # Using nvdlib to search for CVEs
            # Note: Without an API key, this might be slow or rate limited.
            # We search for the package name and version.
            keyword = f"{package_name} {version}"
            results = nvdlib.searchCVE(keywordSearch=keyword, limit=5)
            
            vulns = []
            for item in results:
                cve_id = item.id
                description = item.descriptions[0].value if item.descriptions else "No description"
                
                # Extract CVSS
                cvss_score = 0.0
                severity = Severity.MEDIUM
                
                if hasattr(item, 'v31score'):
                    cvss_score = float(item.v31score)
                    if hasattr(item, 'v31severity'):
                        sev_str = item.v31severity.upper()
                        if sev_str == "CRITICAL": severity = Severity.CRITICAL
                        elif sev_str == "HIGH": severity = Severity.HIGH
                        elif sev_str == "LOW": severity = Severity.LOW
                elif hasattr(item, 'v2score'):
                    cvss_score = float(item.v2score)
                
                vulns.append(Vulnerability(
                    cve_id=cve_id,
                    severity=severity,
                    description=description,
                    cvss_score=cvss_score,
                    fixed_version=None # NVD doesn't easily give fixed version in this view
                ))
            
            return vulns
        except Exception as e:
            self.logger.debug(f"NVD API request failed: {e}")
            return []

    def _infer_severity(self, vuln: Dict[str, Any]) -> Severity:
        """Infer severity from OSV vulnerability data."""
        # PRIORITY 1: database_specific.severity (GitHub reviewed - most reliable)
        db_specific = vuln.get("database_specific", {})
        if isinstance(db_specific, dict):
            severity_str = db_specific.get("severity")
            if severity_str:
                severity_map = {
                    "CRITICAL": Severity.CRITICAL,
                    "HIGH": Severity.HIGH,
                    "MODERATE": Severity.MEDIUM,
                    "MEDIUM": Severity.MEDIUM,
                    "LOW": Severity.LOW
                }
                mapped = severity_map.get(str(severity_str).upper())
                if mapped:
                    self.logger.debug(f"Using database_specific.severity: {severity_str} -> {mapped.value}")
                    return mapped
        
        # PRIORITY 2: Try OSV severity list (array of CVSS objects)
        severities = vuln.get("severity", [])
        if isinstance(severities, list) and len(severities) > 0:
            for sev in severities:
                if isinstance(sev, dict):
                    # The score is a CVSS vector string like "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
                    # We need to estimate score from the vector metrics
                    if sev.get("type") in ["CVSS_V3", "CVSS_V2"]:
                        score = self._estimate_cvss_from_vector(sev.get("score", ""))
                        if score is not None:
                            severity = self._severity_from_cvss(score)
                            self.logger.debug(f"Using CVSS vector estimated score: {score} -> {severity.value}")
                            return severity
        
        # PRIORITY 3: Fallback - check description for severity keywords
        description = vuln.get("summary", "")
        if description:
            desc_lower = description.lower()
            if any(keyword in desc_lower for keyword in ["critical", "rce", "remote code execution"]):
                self.logger.debug(f"Using description inference: CRITICAL")
                return Severity.CRITICAL
            if any(keyword in desc_lower for keyword in ["xss", "cross-site", "authentication bypass", "injection"]):
                self.logger.debug(f"Using description inference: HIGH")
                return Severity.HIGH
        
        self.logger.debug(f"Defaulting to MEDIUM severity")
        return Severity.MEDIUM

    def _extract_cvss(self, vuln: Dict[str, Any]) -> float:
        """Extract CVSS score from OSV vulnerability."""
        try:
            # OSV stores severity as a list of objects
            severities = vuln.get("severity", [])
            if isinstance(severities, list):
                for sev in severities:
                    if isinstance(sev, dict):
                        score_str = sev.get("score")
                        if score_str:
                            # Handle case where score is a string with vector or direct number
                            score = self._extract_cvss_score_from_vector(score_str)
                            if score is not None:
                                return score
        except (TypeError, ValueError):
            pass
        return 0.0
    
    def _extract_cvss_score_from_vector(self, score_input: str | float) -> Optional[float]:
        """Extract numeric CVSS score from vector string or direct number."""
        try:
            # If it's already a number, return it
            if isinstance(score_input, (int, float)):
                return float(score_input)
            
            # If it's a string, try to parse
            if isinstance(score_input, str):
                # Try direct float conversion first
                try:
                    return float(score_input)
                except ValueError:
                    pass
                
                # CVSS vector format: CVSS:3.1/AV:N/AC:L/... with score at end or separate
                # Some APIs include score after the vector
                import re
                # Look for a number in the string
                match = re.search(r'\d+\.\d+', score_input)
                if match:
                    return float(match.group())
        except (TypeError, ValueError, AttributeError):
            pass
        return None
    
    def _estimate_cvss_from_vector(self, vector_string: str) -> Optional[float]:
        """Estimate CVSS score from a vector string by analyzing its metrics.
        
        Example vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N"
        
        For CVSS v3.x, we estimate based on impact metrics:
        - C (Confidentiality): N=0, L=0.5, H=2.0
        - I (Integrity): N=0, L=0.5, H=2.0  
        - A (Availability): N=0, L=0.5, H=2.0
        """
        if not vector_string or not isinstance(vector_string, str):
            return None
        
        try:
            # Base score for network-accessible vulnerability
            score = 0.0
            
            # Parse confidentiality impact (highest weight for info disclosure)
            if "/C:H" in vector_string or ",C:H" in vector_string:
                score += 2.0  # High confidentiality impact -> ~7.5
            elif "/C:L" in vector_string or ",C:L" in vector_string:
                score += 1.0
            
            # Parse integrity impact
            if "/I:H" in vector_string or ",I:H" in vector_string:
                score += 1.5  # High integrity impact
            elif "/I:L" in vector_string or ",I:L" in vector_string:
                score += 0.5
            
            # Parse availability impact
            if "/A:H" in vector_string or ",A:H" in vector_string:
                score += 1.5  # High availability impact
            elif "/A:L" in vector_string or ",A:L" in vector_string:
                score += 0.5
            
            # If network accessible (most likely for npm packages)
            if "/AV:N" in vector_string:
                score += 2.0
            
            # Normalize to 0-10 scale
            score = min(score, 10.0)
            
            # Ensure we return a reasonable minimum
            if score < 2.0 and ("C:H" in vector_string or "I:H" in vector_string or "A:H" in vector_string):
                score = 7.0  # If any High impact, at least HIGH severity
            
            return score if score > 0 else None
            
        except (TypeError, ValueError, AttributeError):
            pass
        
        return None
    
    def _severity_from_cvss(self, cvss_score: float) -> Severity:
        """Map CVSS score to severity level."""
        if cvss_score >= 9.0:
            return Severity.CRITICAL
        elif cvss_score >= 7.0:
            return Severity.HIGH
        elif cvss_score >= 4.0:
            return Severity.MEDIUM
        else:
            return Severity.LOW

    def _preferred_id(self, vuln: Dict[str, Any]) -> str:
        """
        Prefer a CVE identifier over the OSV/GHSA id.

        OSV returns e.g. id='GHSA-qghr-877h-f9jh' with the real CVE in the
        `aliases` list. We surface CVE-XXXX-YYYY when present so the report
        shows recognizable CVE numbers, falling back to the OSV id otherwise.
        """
        aliases = vuln.get("aliases", []) or []
        for alias in aliases:
            if isinstance(alias, str) and alias.upper().startswith("CVE-"):
                return alias
        return vuln.get("id", "UNKNOWN")

    def _extract_description(self, vuln: Dict[str, Any]) -> str:
        """Short human-readable summary; fall back to details, then a default."""
        summary = vuln.get("summary")
        if summary:
            return summary
        details = vuln.get("details")
        if details:
            # `details` can be long markdown — keep the dropdown compact.
            return details.strip().split("\n")[0][:280]
        return "No description available"

    def _extract_fixed_version(self, vuln: Dict[str, Any]) -> Optional[str]:
        """Extract fixed version from OSV vulnerability."""
        affected = vuln.get("affected", [])
        for item in affected:
            ranges = item.get("ranges", [])
            for range_item in ranges:
                if range_item.get("type") == "SEMVER":
                    events = range_item.get("events", [])
                    for event in events:
                        if "fixed" in event:
                            return event["fixed"]
        return None


# --- Parsers -------------------------------------------

class DependencyParser:
    def parse_requirements_txt(self, file_path: str) -> List[Tuple[str, str, bool]]:
        try:
            deps: List[Tuple[str, str, bool]] = []
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "==" in line:
                        name, ver = line.split("==", 1)
                        deps.append((name.strip(), ver.strip(), True))
                    else:
                        deps.append((line, "", True))
            return deps
        except Exception:
            return []

    def parse_package_json(self, file_path: str) -> List[Tuple[str, str, bool]]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                obj = json.load(f)
            deps = []
            for section in ("dependencies", "devDependencies"):
                for name, ver in obj.get(section, {}).items():
                    # Clean version string (remove ^, ~)
                    clean_ver = ver.replace('^', '').replace('~', '')
                    deps.append((name, clean_ver, section == "dependencies"))
            return deps
        except Exception:
            return []

    def parse_pyproject_toml(self, file_path: str) -> List[Tuple[str, str, bool]]:
        """
        Parse a pyproject.toml for Python dependencies. Supports both the
        PEP 621 style ([project].dependencies / optional-dependencies) and
        the Poetry style ([tool.poetry.dependencies] / group deps).

        Returns (name, version, direct) tuples. Version constraints are
        normalized to a bare version where possible so OSV can match; if a
        pin can't be resolved to a concrete version it's left empty.
        """
        try:
            try:
                import tomllib  # Python 3.11+
                with open(file_path, "rb") as f:
                    data = tomllib.load(f)
            except ModuleNotFoundError:  # pragma: no cover - older interpreters
                import toml
                with open(file_path, "r", encoding="utf-8") as f:
                    data = toml.load(f)

            deps: List[Tuple[str, str, bool]] = []

            # --- PEP 621: [project] dependencies (list of PEP 508 strings) ---
            project = data.get("project", {}) or {}
            for spec in project.get("dependencies", []) or []:
                parsed = self._parse_pep508(spec)
                if parsed:
                    deps.append((parsed[0], parsed[1], True))
            # optional-dependencies is a dict of extra -> [specs]
            for specs in (project.get("optional-dependencies", {}) or {}).values():
                for spec in specs or []:
                    parsed = self._parse_pep508(spec)
                    if parsed:
                        deps.append((parsed[0], parsed[1], False))

            # --- Poetry: [tool.poetry.dependencies] (name -> constraint) ---
            poetry = (data.get("tool", {}) or {}).get("poetry", {}) or {}
            for section, direct in (("dependencies", True), ("dev-dependencies", False)):
                for name, constraint in (poetry.get(section, {}) or {}).items():
                    if name.lower() == "python":
                        continue
                    ver = self._normalize_version(
                        constraint if isinstance(constraint, str)
                        else (constraint.get("version", "") if isinstance(constraint, dict) else "")
                    )
                    deps.append((name, ver, direct))
            # Poetry 1.2+ dependency groups: [tool.poetry.group.<g>.dependencies]
            for group in (poetry.get("group", {}) or {}).values():
                for name, constraint in (group.get("dependencies", {}) or {}).items():
                    if name.lower() == "python":
                        continue
                    ver = self._normalize_version(
                        constraint if isinstance(constraint, str)
                        else (constraint.get("version", "") if isinstance(constraint, dict) else "")
                    )
                    deps.append((name, ver, False))

            return deps
        except Exception:
            return []

    def _parse_pep508(self, spec: str) -> Optional[Tuple[str, str]]:
        """Extract (name, version) from a PEP 508 requirement string."""
        import re
        spec = (spec or "").strip()
        if not spec:
            return None
        # Drop environment markers and extras: "pkg[extra]>=1.2; python_version<'3.9'"
        spec = spec.split(";", 1)[0].strip()
        m = re.match(r"^([A-Za-z0-9._-]+)", spec)
        if not m:
            return None
        name = m.group(1)
        rest = spec[len(name):].strip().lstrip("[")  # skip past extras if present
        version = self._normalize_version(rest)
        return name, version

    def _normalize_version(self, constraint: str) -> str:
        """
        Reduce a version constraint to a concrete version string when one is
        pinned (==, ===), else return empty so downstream still records the dep.
        Caret/tilde/>=... ranges resolve to their lower bound as a best effort.
        """
        import re
        if not constraint:
            return ""
        constraint = constraint.strip().strip('"').strip("'")
        # Extras leftover like "]>=1.2.0"
        if "]" in constraint:
            constraint = constraint.split("]", 1)[1]
        m = re.search(r"\d+(?:\.\d+)*(?:[.\-]?[A-Za-z0-9]+)*", constraint)
        return m.group(0) if m else ""

    def parse_pom_xml(self, file_path: str) -> List[Tuple[str, str, bool]]:
        try:
            from xml.etree import ElementTree as ET
            tree = ET.parse(file_path)
            root = tree.getroot()
            deps = []
            # Handle namespaces if present, but simple findall often works for simple poms
            # If namespace is present, this might fail. Let's try a naive approach for now.
            for dep in root.findall('.//{*}dependency'):
                aid = dep.find('{*}artifactId')
                ver = dep.find('{*}version')
                # Fallback without namespace
                if aid is None: aid = dep.find('artifactId')
                if ver is None: ver = dep.find('version')
                
                if aid is not None:
                    deps.append((aid.text or "", (ver.text or "") if ver is not None else "", True))
            return deps
        except Exception:
            return []

    def parse_dockerfile(self, file_path: str) -> List[Tuple[str, str, bool]]:
        try:
            deps: List[Tuple[str, str, bool]] = []
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.upper().startswith("FROM "):
                        parts = line.split()
                        if len(parts) >= 2:
                            image = parts[1]
                            if ":" in image:
                                name, ver = image.split(":", 1)
                            else:
                                name, ver = image, "latest"
                            deps.append((name, ver, False))
            return deps
        except Exception:
            return []


# --- SAST -----------------------------------------------------------------
# (Keeping SAST minimal/same as before)

@dataclass
class CodeVulnerability:
    rule_id: str
    severity: Severity
    file_path: str
    line_number: int
    description: str
    code_snippet: str


@dataclass
class SastRule:
    id: str
    pattern: str
    severity: Severity
    description: str
    tags: List[str] = field(default_factory=list)


class RuleDatabase:
    DEFAULT_RULES: Dict[str, Dict[str, Any]] = {
        "HARDCODED_SECRETS": {
            "pattern": r"(SECRET|API_KEY|PASSWORD)\s*=\s*['\"][\w\-]{20,}['\"]",
            "severity": "high",
            "description": "Potential hardcoded secrets",
            "tags": ["secrets"]
        },
        "UNSAFE_EVAL": {
            "pattern": r"(eval|Function|vm\.runInThisContext)\s*\(",
            "severity": "critical",
            "description": "Use of eval or dynamic code execution",
            "tags": ["rce"]
        },
    }

    def __init__(self):
        self.rules: Dict[str, SastRule] = {}
        self._load_defaults()

    def _load_defaults(self):
        for rule_id, rule_data in self.DEFAULT_RULES.items():
            self.rules[rule_id] = SastRule(
                id=rule_id,
                pattern=rule_data["pattern"],
                severity=Severity(rule_data["severity"]),
                description=rule_data["description"],
                tags=rule_data.get("tags", [])
            )
    
    def get_rules(self) -> Dict[str, SastRule]:
        return self.rules


class StaticAnalyzer:
    def __init__(self):
        self.rule_db = RuleDatabase()

    def analyze_file(self, file_path: str) -> List[CodeVulnerability]:
        import re
        vulnerabilities = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
            
            rules = self.rule_db.get_rules()
            for line_num, line in enumerate(lines, 1):
                for rule_id, rule in rules.items():
                    if re.search(rule.pattern, line, re.IGNORECASE):
                        vulnerabilities.append(CodeVulnerability(
                            rule_id=rule.id,
                            severity=rule.severity,
                            file_path=Path(file_path).name, # Just filename for report
                            line_number=line_num,
                            description=rule.description,
                            code_snippet=line.strip()[:100] # Truncate
                        ))
        except Exception:
            pass
        return vulnerabilities

    def analyze_project(self, project_path: str | Path) -> List[CodeVulnerability]:
        p = Path(project_path)
        all_vulns = []
        extensions = {".js", ".py", ".ts", ".jsx", ".tsx"}
        
        for file_path in p.rglob("*"):
            if file_path.suffix in extensions and "node_modules" not in str(file_path):
                vulns = self.analyze_file(str(file_path))
                all_vulns.extend(vulns)
        
        return sorted(all_vulns, key=lambda v: v.severity.value)


# --- Main analyzer --------------------------------------------------------

class SoftwareCompositionAnalyzer:
    def __init__(self, *, max_workers: int = 4, logger: Optional[logging.Logger] = None):
        self.max_workers = max_workers
        self.logger = logger or logging.getLogger(__name__)
        self.parser = DependencyParser()
        self.vuln_db = VulnerabilityDatabase(logger=self.logger)
        self.sast = StaticAnalyzer()

    def scan_project(self, project_path: str | Path, project_name: str = "project") -> Dict[str, Any]:
        p = Path(project_path)
        result = SCAResult(project_name=project_name)
        
        # Files to check - we look for them in the root of the provided path
        files_to_check = [p / 'requirements.txt', p / 'package.json',
                          p / 'pyproject.toml', p / 'pom.xml', p / 'Dockerfile']
        all_deps: List[Dependency] = []

        for fp in files_to_check:
            if not fp.exists():
                continue
            
            deps = []
            if fp.name == 'requirements.txt':
                raw = self.parser.parse_requirements_txt(str(fp))
                for name, ver, direct in raw:
                    d = self._analyze_dependency(name, ver, direct, 'pip')
                    if d: deps.append(d)
            elif fp.name == 'package.json':
                raw = self.parser.parse_package_json(str(fp))
                for name, ver, direct in raw:
                    d = self._analyze_dependency(name, ver, direct, 'npm')
                    if d: deps.append(d)
            elif fp.name == 'pyproject.toml':
                raw = self.parser.parse_pyproject_toml(str(fp))
                for name, ver, direct in raw:
                    d = self._analyze_dependency(name, ver, direct, 'pip')
                    if d: deps.append(d)
            elif fp.name == 'pom.xml':
                raw = self.parser.parse_pom_xml(str(fp))
                for name, ver, direct in raw:
                    d = self._analyze_dependency(name, ver, direct, 'maven')
                    if d: deps.append(d)
            elif fp.name == 'Dockerfile':
                raw = self.parser.parse_dockerfile(str(fp))
                for name, ver, direct in raw:
                    d = self._analyze_dependency(name, ver, direct, 'docker')
                    if d: deps.append(d)
            
            all_deps.extend(deps)

        result.dependencies = sorted(all_deps, key=lambda d: d.risk_score, reverse=True)
        
        # Run SAST
        code_vulns = self.sast.analyze_project(p)
        
        # Format Output
        return self._format_result(result, code_vulns)

    def _analyze_dependency(self, name: str, version: str, direct: bool, ecosystem: str) -> Optional[Dependency]:
        try:
            # If version is empty, we can't really check for vulns effectively, but we'll try
            if not version:
                version = "0.0.0" # Placeholder or skip?
            
            vulnerabilities = self.vuln_db.check_vulnerabilities(name, version, ecosystem)
            license_info = LicenseDatabase.get_license('MIT') # Stub
            
            return Dependency(
                name=name,
                version=version,
                package_manager=ecosystem,
                license=license_info,
                vulnerabilities=vulnerabilities,
                direct=direct,
                deprecated=False,
            )
        except Exception:
            return None

    def _format_result(self, result: SCAResult, code_vulns: List[CodeVulnerability]) -> Dict[str, Any]:
        return {
            'project': result.project_name,
            'scan_date': result.scan_date,
            'stats': result.calculate_stats(),
            'dependencies': [
                {
                    'name': d.name,
                    'version': d.version,
                    'package_manager': d.package_manager,
                    'risk_score': d.risk_score,
                    'vulnerabilities': [
                        {
                            'cve_id': v.cve_id,
                            'severity': v.severity.value,
                            'description': v.description,
                            'cvss_score': v.cvss_score,
                            'fixed_version': v.fixed_version
                        }
                        for v in d.vulnerabilities
                    ],
                }
                for d in result.dependencies
            ],
            'code_vulnerabilities': [
                {
                    'rule_id': v.rule_id,
                    'severity': v.severity.value,
                    'file': v.file_path,
                    'line': v.line_number,
                    'description': v.description,
                    'code_snippet': v.code_snippet
                }
                for v in code_vulns
            ]
        }
