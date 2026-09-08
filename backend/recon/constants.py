"""
Canonical tool registry keys — the single source of truth shared by tool
wrappers (recon/tools/*) and pipeline steps (recon/pipeline/*).

Tool wrappers register under these keys via @register_tool(KEY).
Pipeline steps fetch tools via get_tool(KEY).
"""

# ProjectDiscovery / network + crawling
SUBFINDER = 'subfinder'
HTTPX = 'httpx'
NAABU = 'naabu'
DNSX = 'dnsx'
GAU = 'gau'
KATANA = 'katana'

# Vulnerability scanning
NUCLEI = 'nuclei'
DALFOX = 'dalfox'
SQLMAP = 'sqlmap'
FFUF = 'ffuf'
GF = 'gf'
GITLEAKS = 'gitleaks'

# Custom Python checkers (no external binary, or thin API clients)
S3_ENUM = 's3_enum'
DNS_TAKEOVER = 'dns_takeover'
JS_SECRETS = 'js_secrets'
TECH_DETECT = 'tech_detect'
BACKUP_FINDER = 'backup_finder'
DEP_CONFUSION = 'dep_confusion'
JWT_TOOL = 'jwt_tool'
MOBSF = 'mobsf'
AEM = 'aem'

# API security scanner (authenticated OWASP API Top 10 active checks) + recon.
API_SCANNER = 'api_scanner'
API_RECON = 'api_recon'
