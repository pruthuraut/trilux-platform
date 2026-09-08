# Obsedian Guard / Trilux — Backend

A **Django 5.1 + Django REST Framework** backend for an application-security
**scanning** platform (Django project name: `trilux`). Users register projects and
run security scans against them — SAST (per-file LLM code review + GitLeaks secrets +
CVE scan), DAST (Nuclei), attack-surface **recon**, mobile app (APK/IPA) and browser
extension analysis. Scans run asynchronously on Celery, are normalized by an LLM into
structured findings, and reports are stored on S3 / Cloudflare R2.

> Note: an older version of this README described an "LLM firewall / prompt-injection"
> product. That framing is outdated — the code is a **code & application security scanner**
> (SAST / DAST / recon / secrets / mobile / extension). Trust the code, not legacy docs.

---

## Architecture

Django apps (root URL router: `trilux/urls.py`):

| App | Mount | Responsibility |
|-----|-------|----------------|
| `authenticate` | `/auth/` | Custom email-login `User`, `Organization`, JWT signin/signup, OTP email flow, forgot/reset password, UUID demo login, token validation. |
| `api` | `/api/` | The core: project CRUD + all scan types (static / dynamic / mobile / extension) + reports, billing, support, notifications. Heavy logic in `api/views.py` and the Celery tasks in `api/tasks.py`. |
| `blog` | `/blog/` | Blog posts + comments. |
| `portal` | `/portal/` | Public marketing content (services, features, testimonials, FAQ, team, pricing, privacy/terms). |
| `dashboard` | `/dashboard/` | Minimal server-side dashboard endpoints. |
| `recon` | `/recon/` | **Dynamic Testing** — the new attack-surface recon framework (see below). |

Supporting layers: `trilux/` (settings, config, Celery, middleware), `helpers/`
(`s3_helper.py`, `smtp_helper.py`).

### `recon` — the 12-step Dynamic Testing pipeline

`recon` is a pluggable recon framework that **shells out to real CLI tools** rather than
reimplementing them. A domain run executes 12 ordered steps:

1. Subdomain Enumeration (`subfinder`)
2. Live Host Detection (`httpx`)
3. Port Scanning (`naabu`)
4. Tech Detection (`tech_detect`, custom Python)
5. DNS Takeover Checks (`dns_takeover`, custom)
6. S3 Bucket Enumeration (`s3_enum`, custom)
7. Nuclei Scanning (`nuclei`)
8. JavaScript / Secret Scanning (`js_secrets`, custom)
9. URL Collection (`gau` + `katana`)
10. GF Pattern Matching (`gf`)
11. Backup File Discovery (`backup_finder`, custom)
12. Misconfiguration Scan (`nuclei` misconfig/exposure templates)

The external tools driven include the ProjectDiscovery stack
(`subfinder`/`httpx`/`naabu`/`dnsx`/`katana`/`gau`) plus
`nuclei`/`dalfox`/`sqlmap`/`ffuf`/`gf`/`gitleaks` (and on-demand `jwt_tool`,
dependency-confusion, MobSF, AEM). Each tool runs through a **pluggable runner**
(`recon/runtime/`) — either a local subprocess **or** a sandboxed, ephemeral Docker
container — selected by `RECON_EXECUTION_BACKEND`. Missing tool binaries degrade
gracefully to `SKIPPED` (partial results) instead of crashing the pipeline. Findings
are persisted to the DB, artifacts uploaded to R2, and an AI layer summarizes the run.

---

## Quick start — one command

From the repository root, bring up the whole platform:

```bash
docker compose -f backend/docker-compose.yml up --build
```

This starts the unified stack: **postgres**, **redis**, **web** (Django/Gunicorn),
**celery_worker**, **celery_beat**, and **dashboard** (Next.js). Once up:

| Service | URL |
|---------|-----|
| Dashboard UI | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Django admin | http://localhost:8000/admin/ |

Notes:

- The dashboard build context defaults to `../frontend`. Override with the
  `DASHBOARD_CONTEXT` env var if it lives elsewhere.
- The web service auto-runs `collectstatic` + `migrate` on boot (`RUN_MIGRATIONS=1`).
- **Auto-create an admin**: set `DJANGO_SUPERUSER_EMAIL` and `DJANGO_SUPERUSER_PASSWORD`
  before `docker compose up` and a superuser is created on first boot.
- Most config has sane local defaults (see `docker-compose.yml`); S3/R2 + LLM keys are
  optional locally (uploads/AI are skipped if unset).

### Sandbox toolbox image (for `RECON_EXECUTION_BACKEND=docker`)

In the compose stack the recon backend defaults to `docker`, which runs each scan tool
in a hardened ephemeral container built from the `trilux-toolbox` image. Build that
image once with:

```bash
docker compose --profile build build toolbox
```

The Celery worker has the host docker socket mounted (Docker-outside-of-Docker) and
spawns these containers; the app/worker images themselves stay slim (only need the
`docker` CLI on the worker).

---

## Manual / local dev setup (without Docker)

For lightweight development you can run without Postgres or Redis.

```bash
# 1. Python 3.13 (3.14 lacked wheels for the pinned deps)
python3.13 -m venv venv
source venv/bin/activate

# 2. Install deps
pip install -r requirements.txt

# 3. Create a .env (start from sample.env) — for no-DB/no-Redis dev set:
#      USE_LOCMEM_CACHE=True
#      DATABASE_URL=sqlite:///db.sqlite3
#      RECON_EXECUTION_BACKEND=local
#      ALLOWED_HOSTS=localhost,127.0.0.1
#      CSRF_AND_CORS_URLS=http://localhost:3000

# 4. Migrate + run
python manage.py migrate
python manage.py runserver        # API on http://localhost:8000
```

For scans to actually run you also need a Celery worker:

```bash
celery -A trilux.celery worker -l info
celery -A trilux.celery beat -l info     # scheduler (periodic tasks)
```

Local-dev conveniences baked into the code:

- `USE_LOCMEM_CACHE=True` swaps the Redis cache for an in-memory cache so the app boots
  without Redis.
- With no Redis broker, recon views fall back to **eager (synchronous)** task execution
  (`_enqueue()` in `recon/views.py`) instead of erroring — so a `POST /recon/scan/` still
  runs end-to-end without a worker.
- `ReconStorage` is R2-optional: with missing/invalid R2 creds it disables uploads (logs
  a warning) — findings still persist to the DB.
- With `RECON_EXECUTION_BACKEND=local`, recon tools run as subprocesses on the host;
  any missing binary just yields `SKIPPED` steps.

---

## API overview

All endpoints require a **JWT Bearer token** (`Authorization: Bearer <access>`) except
auth bootstrap routes (signin / signup / OTP / forgot-reset). Obtain a token via
`POST /auth/signin/`.

### `/auth/` — authentication (`authenticate/urls.py`)

```
POST /auth/signin/                 email + password -> access/refresh tokens
POST /auth/signup/                 register
POST /auth/signout/                logout
POST /auth/verifyOTP/              verify email OTP
POST /auth/forgotPassword/         request reset
POST /auth/resetPassword/          complete reset
POST /auth/uuid-login/             UUID-based demo login
POST /auth/validate-token/         validate a JWT
GET  /auth/profile/                current user profile
GET/POST /auth/organization/[<id>/]
POST /auth/create-demo-user/  ·  GET /auth/demo-access-accounts/
```

### `/api/` — projects + scans (`api/urls.py`)

```
GET/POST /api/project/  ·  GET/PUT/DELETE /api/project/<id>/
       /api/static-analysis/[<scan_uuid>/]          SAST (LLM / GitLeaks / CVEscan)
       /api/dynamic-analysis/[<scan_uuid>/]         DAST (Nuclei)
       /api/mobile-app-analysis/[<scan_uuid>/]      APK / IPA
       /api/browser-extension-analysis/[<scan_uuid>/]  CRX / XPI / ZIP
       /api/analyses/[<id>/]                         combined static + dynamic
       /api/vulnerability-analysis/[<id>/]
       /api/report/[<report_uuid>/]
       /api/security-policy/  ·  /api/security-alert/
       /api/support-ticket/   ·  /api/support-chat/  ·  /api/notification/
       /api/dashboard-analytics/  ·  /api/pricing/  ·  /api/subscription/  ·  /api/payment/
# Superuser-only email senders:
POST /api/send-alert-email/  ·  send-marketing-email  ·  send-subscription-email
     send-invoice-email  ·  send-waitlist-email
POST /api/join-waitlist/  ·  /api/contact-form/
```

Scan flow: `POST` creates a DB record and kicks off a Celery task (`.delay(...)`); the
task clones/scans/normalizes/uploads and updates the record's status
(`Waiting → InProgress → Completed/Failed`). The client polls the `GET` endpoint
(usually by `scan_uuid`) for status + the result URL.

### `/recon/` — Dynamic Testing pipeline (`recon/urls.py`)

```
POST /recon/scan/                  start a 12-step domain run    body: {target, options}
GET  /recon/scan/                  list the current user's runs
GET  /recon/scan/<uuid>/           run detail (steps + severity rollups)
GET  /recon/scan/<uuid>/findings/  findings for a run (filter ?kind=&severity=)
POST /recon/module/                on-demand module  body: {scan_type, target, options}
                                   scan_type in: xss, sqli, fuzz, jwt, github, mobile, aem, depconf
GET  /recon/tools/                 tool availability report (available / missing)
POST /recon/ai/                    free-form AI analysis         body: {prompt}
POST /recon/brain/<uuid>/          (re)generate the AI summary for a run
```

---

## Recon execution sandbox

Tool execution is pluggable behind `recon/runtime/`, selected by the
`RECON_EXECUTION_BACKEND` env var:

- **`local`** (`LocalRunner`) — runs each tool as a subprocess on the Celery worker host.
  Intended for dev / a trusted host. Availability = binary on `PATH` (or a
  `TOOL_<NAME>` path override).
- **`docker`** (`DockerRunner`, recommended) — runs **each tool invocation in an
  ephemeral, hardened, `--rm` container** spawned from the `trilux-toolbox` image via the
  host docker socket (Docker-outside-of-Docker). Tools do **not** run on the worker
  directly. Hardening per container: `--cap-drop ALL`, `--security-opt
  no-new-privileges`, `--read-only` root fs, tmpfs `/tmp`, `--pids-limit`,
  `--memory`/`--cpus` caps, non-root `--user`, attached to the isolated
  `trilux_scan_net` bridge. Output files use a shared work dir (`RECON_WORK_DIR`) mounted
  at the **same absolute path** in worker and tool containers so artifact parsing works.

Build the toolbox image with `docker compose --profile build build toolbox`.

If a tool binary is unavailable (missing on `PATH` in local mode, or docker absent in
docker mode), the affected step is reported as **`SKIPPED`** and the run continues with
partial results. Check what's available at any time via `GET /recon/tools/`.

---

## Environment variables

Config is read from a `.env` file (see `sample.env`) via both `python-decouple` (in
`settings.py`) and the `Config` class in `trilux/config.py`. Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | DB DSN (`postgres://...` or `sqlite:///db.sqlite3` for dev). |
| `REDIS_URL` | Redis for cache + Celery broker/results. |
| `ALLOWED_HOSTS` | Comma-separated Django allowed hosts. |
| `CSRF_AND_CORS_URLS` | Comma-separated CSRF-trusted + CORS-allowed origins. |
| `DJANGO_SECRET_KEY` | Django/JWT signing secret. |
| `DEBUG` | `True`/`False`. |
| `USE_LOCMEM_CACHE` | `True` to use in-memory cache (no Redis) for local dev. |
| `JWT_SECRET` | JWT secret (auth helper). |
| `S3_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ACCOUNT_ID` | S3 / Cloudflare R2 credentials. |
| `S3_BUCKET_NAME`, `SCAN_BUCKET`, `GITHUB_REPO_REPORT_BUCKET`, `GITHUB_REPO_SCANS_BUCKET`, `MOBILE_APP_SCAN_BUCKET`, `BROWSER_EXTENSION_SCAN_BUCKET`, `RECON_BUCKET` | Per-scan-type storage buckets. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_PASSWORD` | Outbound email (OTP, alerts). |
| `LLM_API_URL`, `LLM_MODEL_NAME` | OpenAI-compatible LLM endpoint for finding normalization. |
| `GEMINI_API_KEY`, `GEMINI_MODEL_NAME` | Gemini LLM (alternative / fallback). |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Recon AI layer (OpenRouter primary; default model `stepfun/step-3.5-flash:free`). |
| `MOBSF_URL`, `MOBSF_API_KEY` | MobSF integration for mobile analysis. |
| `RECON_EXECUTION_BACKEND` | `local` or `docker` (see sandbox section). |
| `RECON_TOOLBOX_IMAGE` | Toolbox image for docker mode (default `trilux-toolbox:latest`). |
| `RECON_SCAN_NETWORK` | Isolated docker network for spawned tool containers. |
| `RECON_WORK_DIR` | Shared work dir mounted into tool containers. |
| `RECON_CONTAINER_MEM`, `RECON_CONTAINER_CPUS`, `RECON_CONTAINER_PIDS` | Per-container resource caps (docker mode). |
| `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | Optional — auto-create an admin on first Docker boot. |

---

## Frontend

The UI is a separate Next.js app at `../frontend`. In the unified Docker stack
it is built and served automatically at http://localhost:3000. See that repo's README to
run it standalone.
