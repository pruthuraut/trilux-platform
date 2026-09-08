# CLAUDE.md — Project Context (Trilux / Obsedian Guard)

> Working context for this repo. Skim this first before diving into code.

## What this is

A **Django 5.1 + DRF backend** for an application-security scanning platform branded
**"Obsedian Guard"** (Django project name: `trilux`). Users register projects and run
security scans against them; scans run asynchronously via Celery and pipe their raw
output through an **LLM (Gemini / OpenAI-compatible endpoint)** which normalizes findings
into structured JSON. Reports are stored on **S3 / Cloudflare R2**.

> Note: the README markets an "LLM firewall / prompt-injection" product, but the actual
> code is a **code & app security scanner** (SAST/DAST/secrets/mobile/extension). Trust the
> code, not the README, for current behavior.

## Tech stack

- **Web:** Django 5.1, Django REST Framework, JWT auth (`djangorestframework-simplejwt`)
- **Async:** Celery 5.4 + Redis (broker + result backend via `django-celery-results`), `django-celery-beat`
- **DB:** PostgreSQL (via `dj-database-url` / `psycopg`), configured from `DATABASE_URL`
- **Cache/sessions:** Redis (`django-redis`); sessions use `cached_db`
- **Storage:** S3-compatible (boto3) — see `helpers/s3_helper.py`; buckets per scan type
- **LLM:** `api/helpers/llm_helper.py` — `call_llm()` hits an OpenAI-compatible endpoint
  (`LLM_API_URL`/`LLM_MODEL_NAME`) by default, or Gemini SDK when a model arg is passed
- **Serving:** Gunicorn + WhiteNoise (static), Daphne/Channels present in deps
- **Deploy:** Dockerfile + `docker-compose.yml` (web / celery_worker / celery_beat;
  opensearch/prometheus/grafana stanzas are commented out)

## Apps & responsibilities

- **`trilux/`** — project config. `settings.py`, `urls.py` (root router), `config.py`
  (env-var loader `Config` class), `middleware.py` (request logging + IP rate limiting),
  `celery.py`.
- **`authenticate/`** — custom `User` (email login, `username=None`), `Organization`,
  `UserProfile`, `DemoAccessAccount`. JWT signin/signup, OTP email flow (Redis-backed via
  `redis_helpers.py`), forgot/reset password, UUID-based demo login, token validation.
  Routes under `/auth/`.
- **`api/`** — the core. Project CRUD + all scan types + billing/support/notification
  models. Routes under `/api/`. Heavy logic in `api/views.py` (~2150 lines) and
  `api/tasks.py` (Celery scan tasks).
- **`blog/`** — blog + comments (`/blog/`).
- **`portal/`** — public marketing site content: services, features, testimonials, FAQ,
  team, pricing, privacy/terms (`/portal/`).
- **`dashboard/`** — minimal (`/dashboard/`).
- **`recon/`** — **NEW** attack-surface recon framework (routes under `/recon/`). A
  12-step domain pipeline that shells out to real CLI tools (ProjectDiscovery stack +
  dalfox/sqlmap/ffuf/gf/gitleaks/MobSF) plus custom Python checkers. See the
  "Recon framework" section below.
- **`helpers/`** — `s3_helper.py` (S3/R2 wrapper, returns `{success, message, ...}` dicts),
  `smtp_helper.py`.
- **`obsedianguard/`** — appears to be a stale/duplicate settings module (DEBUG=True);
  the live project module is `trilux`. Don't edit `obsedianguard` expecting effect.

## Scan types (the heart of the product)

Defined as models in `api/models.py`, driven by Celery tasks in `api/tasks.py`:

1. **StaticAnalysis** — types `LLM` / `GitLeaks` / `CVEscan` / `Taint`. Flow: clone GitHub
   repo → upload to S3 (`CloneRepoTask`) → per-file LLM vuln scan (`LLMtestingTask`, threaded,
   OWASP-Top-10 categorization) → report JSON to S3. `GitLeaksTestingTask` runs the
   `gitleaks` CLI for secrets.
   - **Source input:** a GitHub URL **or** an uploaded `.zip` of dropped source. A multipart
     `source_file` on `POST /api/static-analysis/` auto-routes to `Taint` (no URL/token needed);
     `source_type` is `github`|`upload`, `source_file` is a FileField. Uploads land in
     `media/sast_uploads/` (worker reads them via the shared `./media` mount).
   - **`Taint` (cross-file taint SAST)** — deterministic, no LLM. Engine in `api/helpers/sast/`
     (`taint_engine.py` cross-file algorithm, `knowledge.py` sinks/sources/sanitizers,
     `collector.py`, `scan_repo()`). Repo-wide: parses every `.py`, resolves imports to a global
     symbol table, computes per-function return-taint summaries, then propagates from entry
     points (framework handlers / request-source reads) through the **inter-file call graph**
     (≤6 hops) — tracing e.g. `views.py → services.py → db.py`. Findings (source→sink path,
     CWE/OWASP, severity, `cross_file`, confidence) stored inline on `Taint_analysis_result`
     (JSONField; works without S3). Python only today; JS/TS is a follow-up.
   - **`TaintAnalysisTask`** runs standalone for `type=Taint` (`is_primary=True`, owns status)
     and is **auto-triggered alongside every other static scan** (`is_primary=False` — only
     writes `Taint_analysis_result`, never touches `static_analysis_status`, so no race).
   - **LLM path hardening** (`LLMtestingTask`): large files are split into overlapping,
     line-numbered chunks (`_chunk_code_by_lines`, ~12k chars, 20-line overlap) so nothing is
     silently truncated past the context window and findings map to real line numbers; files
     >2 MB are skipped with an explicit `scan_error` (never mistaken for "clean"); chunk/LLM
     failures surface as `scan_error` records. `call_llm(..., temperature=0.0)` is now
     **deterministic by default** (was 0.7) — same input → same findings, so scans are
     diffable/CI-gateable (both the OpenAI-compatible and Gemini paths).
2. **DynamicAnalysis** — type `Nuclei`. `NucleiTestingTask` runs the `nuclei` CLI against a
   target URL, then LLM-normalizes output.
3. **MobileAppAnalysis** — APK/IPA upload → `api/helpers/mobile_app_parcer.py` → LLM.
4. **BrowserExtensionAnalysis** — CRX/XPI/SAFARIEXTZ/ZIP → `api/helpers/extension_parser.py` → LLM.
5. **Testing** — legacy/older combined model, still wired at `/api/testing/`.

Each scan: status state machine (`Waiting→Cloning/Uploading→InProgress→Completed/Failed`),
a `scan_uuid`, and a `*_analysis_result` URL pointing at the S3 report.

Supporting models: `VulnerabilityAnalysis`, `Report`, `SecurityPolicy`, `SecurityAlert`,
`SupportTicket`, `SupportChat`, `Notification`, `DashboardAnalytics`, `PricingPlan`,
`Subscription`, `Payment`, `EarlyAccessUser`, `ContactForm`.

## Request flow

Client → DRF `APIView` (most use `JWTAuthentication` + `IsAuthenticated`; email-send views
require `IsSuperuser` via `api/permissions.py`) → creates a DB record → kicks off a Celery
task (`.delay(...)`) → task does clone/scan/LLM/upload → updates the record's status +
result URL. Client polls the GET endpoint (often by `scan_uuid`) for status/results.

`nuclei-templates-main/` is a bundled copy of Nuclei vuln templates used by DAST scans.

## Recon framework (`recon/` app)

A pluggable recon/scanning framework that **shells out** to real CLI tools rather than
reimplementing them. Added in the refactor.

**Layers (the contracts everything builds on):**
- `recon/tools/base.py` — `BaseTool` (uniform `run() -> ToolResult`, availability
  detection, timeout/skip handling), a registry (`@register_tool`, `get_tool`,
  `availability_report`). Missing binaries degrade to `SKIPPED`, never crash.
- `recon/constants.py` — canonical tool registry keys (single source of truth shared
  by tool wrappers and pipeline steps). **22 tools registered** (incl. `api_scanner`).
- `recon/tools/*.py` — wrappers: `projectdiscovery.py` (subfinder/httpx/naabu/dnsx/
  katana/gau), `scanners.py` (nuclei/dalfox/sqlmap/ffuf/gf), `scanners_extra.py`
  (gitleaks/mobsf), `custom.py` (s3_enum/dns_takeover/js_secrets/tech_detect/
  backup_finder — pure-Python), `ondemand.py` (jwt_tool/dep_confusion/aem),
  `api_scanner.py` (**API security scanner** — pure-Python, see below).
- `recon/pipeline/base.py` + `steps.py` — the **13 ordered steps** (`@register_step`):
  subdomain_enum → live_hosts → port_scan → tech_detect → dns_takeover → s3_enum →
  nuclei_scan → js_scan → url_collection → gf_patterns → backup_discovery →
  misconfig_scan → **api_scan** (step 13, auto-runs when API surface is detected in
  the collected URLs / live hosts, or `options.api_scan=true`). Shared state threads
  through a `PipelineContext`.
- `recon/storage.py` — `ReconStorage` over the existing `S3Helper`; uploads every
  non-empty artifact to R2 under `recon/<run_uuid>/`.
- `recon/ai/client.py` — **pluggable** `call_ai()` selected by `RECON_AI_PROVIDER`
  (**default `bedrock`**; also `openrouter` | `anthropic` | `gemini`), with graceful
  fallback through the rest. `bedrock` reuses the host's existing AWS / Claude Code setup
  (`CLAUDE_CODE_USE_BEDROCK`, `AWS_REGION`) via the `anthropic` SDK's `AnthropicBedrock`
  client — **no API key needed**, creds come from the AWS chain. Uses the standard
  InvokeModel path by default (set `RECON_BEDROCK_USE_MANTLE=1` for the Mantle endpoint).
  Also `summarize_findings()`. Requires `anthropic[bedrock]` (in requirements.txt).
- `recon/models.py` — `ScanRun` (the run aggregate + severity rollups; `ScanType` now
  includes `api`), `StepResult` (per-step status/R2 link), `Finding` (normalized records;
  `Kind` now includes `api_endpoint`/`api_vuln`). Migrations `0001_initial`, `0002` (enum
  additions).
- `recon/tasks.py` — Celery: `run_domain_pipeline` (runs 13 steps, persists, uploads,
  finalizes status COMPLETED/PARTIAL/FAILED), `run_ondemand_module` (dispatch map
  `_ONDEMAND_TOOL_KEYS`, now incl. `'api'`; honours a tool's own `kind`),
  `generate_run_summary`.

**API (under `/recon/`, JWT + IsAuthenticated):**
`POST scan/` start domain run · `GET scan/` list · `GET scan/<uuid>/` detail ·
`GET scan/<uuid>/findings/` (filter `?kind=&severity=`) · `POST module/` on-demand
(xss/sqli/fuzz/jwt/github/mobile/aem/depconf/**api**) · `POST api-scan/` (**API security
scan** — accepts a dropped Postman collection / OpenAPI spec via multipart `file`, or a
JSON body) · `GET tools/` availability · `POST ai/` free-form · `POST brain/<uuid>/`
regenerate AI summary.

**API security scanner (`recon/tools/api_scanner.py`, key `api_scanner`, pure-Python):**
authenticated **OWASP API Top 10 (2023)** active scanner. Discovers endpoints from an
OpenAPI/Swagger spec, a Postman v2.x collection, an explicit `endpoints` list, or light
recon against a base URL (spec auto-discovery + common roots). Checks: API1 BOLA
(cross-user via a 2nd identity + id-walk), API2 broken auth, API3 BOPLA (mass assignment +
excessive data exposure), API4 resource consumption (**bounded** rate-limit probe,
unbounded pagination, oversized-payload, ReDoS timing — never floods), API5 BFLA, API6
sensitive business flows (checkout/signup/… lacking anti-automation), API7 SSRF (metadata
canary), API8 misconfig (headers/CORS/caching/verbose errors), API9 improper inventory
(old `/vN/` versions, exposed docs/debug), API10 unsafe consumption (external redirects).
- **Auth (via `options`):** `auth_token`/`cookie`/`headers` = primary identity;
  `second_auth_token`/`second_cookie`/`second_headers` = a low-priv identity enabling true
  cross-user BOLA/BFLA. `authorize_load_test=true` gates the (still-bounded ≤15-req) burst.
- **Three trigger paths:** (1) pipeline **step 13** auto-runs on detected API surface;
  (2) `POST /recon/api-scan/` on an explicit Postman/OpenAPI drop; (3) `POST /recon/module/`
  `{scan_type:"api"}`. All persist to `ScanRun`/`Finding` (`kind` in api_endpoint/api_vuln).

**To extend:** add a tool = new `BaseTool` subclass + `@register_tool(KEY)` in
`constants.py`; add a step = new `Step` subclass with `@register_step`. Validate with
`python3 -m py_compile` + the registry sanity checks in `recon/tests.py`.

**Execution sandbox (where tools actually run):** tool execution is pluggable behind
`recon/runtime/` (a `Runner` abstraction), selected by env `RECON_EXECUTION_BACKEND`:
- `local` (`LocalRunner`) — subprocess on the Celery worker host. Dev / trusted host.
- `docker` (`DockerRunner`) — **each tool invocation runs in an ephemeral, hardened,
  `--rm` container** spawned from the `trilux-toolbox` image via the host docker socket
  (DooD). So tools do NOT run on the worker directly. Hardening: `--cap-drop ALL`,
  `--security-opt no-new-privileges`, `--read-only`, tmpfs `/tmp`, `--pids-limit`,
  `--memory`/`--cpus`, non-root `--user`, attached to the isolated `trilux_scan_net`.
- `BaseTool.run()` routes through `get_runner()`; the 21 wrappers are unchanged. Output
  files use a shared work dir (`RECON_WORK_DIR`, the `recon_work` volume) mounted at the
  **same absolute path** in worker + tool container so JSONL/report parsing still works.
- Images: app stays slim (`Dockerfile`, only needs `docker.io` CLI on the worker); all
  CLIs live in `Dockerfile.toolbox` → build with `docker compose --profile build build toolbox`.
- Egress: spawned containers reach the public internet but should be firewalled off
  RFC1918 + `169.254.169.254` (metadata) so a malicious target can't pivot inward.
- `is_available()`/`GET /recon/tools/` reflect the active backend (docker present vs
  binary on PATH). Missing → step returns `SKIPPED` (partial results).

## Frontend dashboard (separate repo)

The UI is a **Next.js 14 + TypeScript + Tailwind + Radix** app at
`../trilux-dashboard` (cloned from github.com/pruthuraut/trilux-dashboard). It is a
pure API client — talks to this backend via `NEXT_PUBLIC_API_BASE_URL` (default
`http://localhost:8000`), JWT in `Authorization: Bearer`, token stored by
`utils/tokenManager.ts`, pages wrapped in `utils/withAuth.tsx`.
- Run: `cd ../trilux-dashboard && npm install && npm run dev` → http://localhost:3000.
- It only calls `/auth/` and `/api/` (the pre-existing apps) — those were untouched.
- **Recon UI added** to match the new `/recon/` backend: `app/recon/page.tsx` (runs
  list + start dialog `components/NewReconScanDialog.tsx` + an **"API Scan" button →
  `components/NewApiScanDialog.tsx`** for the OWASP API Top 10 scanner: URL/spec or
  Postman/OpenAPI drop, primary + low-priv auth, bounded rate-limit toggle),
  `app/recon/[uuid]/page.tsx` (run detail: steps + findings + AI summary), nav entry
  "Attack Surface Recon" in `components/Sidebar.tsx`. Mirrors the existing analysis-page idiom.
- Fixed a pre-existing casing mismatch: dashboard now reads both
  `nuclei_analysis_result` and `Nuclei_analysis_result` (serializer uses capital N).

## Local dev runtime notes

- venv on **Python 3.13** (3.14 lacked wheels for pinned deps); full `requirements.txt`
  installed. Run via `./venv/bin/python manage.py ...`.
- Dev `.env` (gitignored) uses **sqlite** + `USE_LOCMEM_CACHE=True` (added to settings,
  env-gated) so the app boots without Postgres/Redis. `RECON_EXECUTION_BACKEND=local`.
- **No Redis locally** → recon views fall back to **eager (synchronous) task execution**
  via `_enqueue()` in `recon/views.py` instead of 500-ing. In Docker/prod with Redis,
  tasks queue normally on Celery.
- `ReconStorage` is **lazy + R2-optional**: with no/invalid R2 creds it disables uploads
  (logs a warning) instead of crashing the pipeline — findings still persist to the DB.
- Verified end-to-end: signin → JWT → `POST /recon/scan/` → pipeline runs → 26 findings
  persisted (CLI tools `skipped`, pure-Python checkers executed).

## Configuration / secrets

- Env loaded two ways: `python-decouple`'s `config(...)` in `settings.py` **and** the
  `Config` class in `trilux/config.py` (`os.getenv`). Both read a `.env` file (see
  `sample.env`). Required keys include `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`,
  `CSRF_AND_CORS_URLS`, S3 keys/buckets, SMTP, `LLM_API_URL`/`LLM_MODEL_NAME`,
  `GEMINI_API_KEY`.
- **Known rough edges (be careful, don't "fix" silently without asking):**
  - `settings.py` hardcodes an insecure `SECRET_KEY` and `DEBUG=False`; JWT signs with it.
  - `REST_FRAMEWORK` is defined twice — the second definition wins, dropping the auth-class
    config and leaving only `JSONRenderer`. Views set `authentication_classes` per-class.
  - `CORS_ALLOW_ALL_ORIGINS=True` plus explicit allowed origins.
  - `api/tasks.py::NucleiTestingTask` has a hardcoded local path
    (`/Users/sanket./Downloads/nuclei-templates-main`) — environment-specific, will break
    elsewhere.
  - LLM calls use `verify=False` (SSL verification disabled) — still open.
  - `call_llm` temperature was `0.7`; **now `0.0` (deterministic)** — a scanner must be
    reproducible. Don't reintroduce sampling for SAST.

## Running

**One command (whole stack — recommended):** with the dashboard cloned as a sibling
(`../trilux-dashboard`), from the backend repo:
```bash
docker compose up --build
# Dashboard UI : http://localhost:3000
# Backend API  : http://localhost:8000  (admin at /admin/)
```
Brings up postgres, redis, web (Django+gunicorn), celery_worker, celery_beat, and the
dashboard. The web entrypoint auto-runs collectstatic + migrate, and seeds an admin if
`DJANGO_SUPERUSER_EMAIL`/`DJANGO_SUPERUSER_PASSWORD` are set. Build the sandbox tool
image once with `docker compose --profile build build toolbox` (needed when
`RECON_EXECUTION_BACKEND=docker`, the compose default).

Compose details: shared Django env via the `x-django-env` YAML anchor; only `web` runs
migrations (`RUN_MIGRATIONS=1`); worker/beat set `RUN_MIGRATIONS=0` to avoid racing.
Dashboard build context is `../trilux-dashboard` (override with `DASHBOARD_CONTEXT`);
`NEXT_PUBLIC_API_BASE_URL` is baked in at build time (default `http://localhost:8000`).
The dashboard uses Next.js **standalone output** (`output: 'standalone'` in
`next.config.mjs`), so its runtime image ships only the traced server bundle + `node server.js`.

> **Low-memory Docker gotcha (dashboard rebuild):** `next build` needs more RAM than a
> small Docker Desktop VM (~1.9 GiB) has while the other containers are running — it gets
> OOM-`SIGKILL`ed. *Running* the stack is fine (one `docker compose up`); only *rebuilding
> the dashboard image* hits this. Fix by either bumping Docker Desktop memory to ~4 GB
> (Settings → Resources), or freeing RAM first:
> ```bash
> docker compose stop web celery_worker celery_beat
> docker compose build dashboard
> docker compose up -d
> ```
> The `NODE_OPTIONS=--max-old-space-size` heap cap in the Dockerfile helps but can't cure a
> VM-level shortage. A host `npm run build` (real RAM) always works.

> **Local port remap:** `docker-compose.override.yml` (in the backend repo) moves the host
> ports to **8001** (backend) and **3001** (dashboard) because 8000/3000 were taken by other
> local apps. The override's `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` keeps the baked
> client URL in sync. Delete the override to go back to 8000/3000.

**Manual / local dev (no Docker):**
```bash
./venv/bin/pip install -r requirements.txt   # venv on Python 3.13
# .env: USE_LOCMEM_CACHE=True, sqlite DATABASE_URL, RECON_EXECUTION_BACKEND=local
./venv/bin/python manage.py migrate
./venv/bin/python manage.py runserver
celery -A trilux.celery worker -l info   # only if you want real async tasks
```
Without Redis, recon views fall back to eager (synchronous) execution (see `_enqueue`).
External CLIs for full scans (local backend): `subfinder, httpx, naabu, dnsx, katana,
nuclei, gau, dalfox, sqlmap, ffuf, gf, gitleaks` — missing ones report `SKIPPED`.

## Docs in repo

`README.md` (marketing overview), `ACCESS_GUIDE.md`, `DEMO_USER_API.md`,
`UUID_LOGIN_API.md`, `MONITORING_SETUP.md`. `test_uuid_login.py`,
`test_validate_token.py`, `s3_test.py` are standalone test scripts.

## Conventions / gotchas

- Custom user model: `AUTH_USER_MODEL='authenticate.User'`, login by **email**.
- Most FKs are named `<thing>_id` but are real `ForeignKey` fields (not raw ids).
- `api/tasks.py` passes data between tasks as a **stringified dict** parsed with
  `ast.literal_eval` — fragile; preserve the shape if editing.
- Timezone: Celery runs `Asia/Kolkata`, Django `USE_TZ=True` / `TIME_ZONE='UTC'`.
- Git status at session start shows a deleted nuclei template
  (`CVE-2017-12615.yaml`) — unrelated to most work.
