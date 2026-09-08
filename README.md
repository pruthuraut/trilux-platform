# Trilux Platform

Trilux is a full-stack security analysis platform combining a Django REST API and asynchronous scan workers with a Next.js dashboard.

## Repository layout

```text
trilux-platform/
├── backend/       # Django API, database models, workers, scanners, and Docker stack
├── frontend/      # Next.js dashboard
├── README.md      # This guide
└── .gitignore     # Shared protection for local secrets and generated files
```

## Features

- Static application security testing (SAST), source inspection, taint analysis, and triage.
- Software composition analysis (SCA) and dependency vulnerability checks.
- Reconnaissance and API scanning through configurable local or containerized tools.
- Mobile application and browser-extension analysis integrations.
- Dynamic analysis workflows and report generation.
- Project, user, access-control, authentication, and administration features.
- Background processing through Celery workers and scheduled tasks through Celery Beat.
- Optional AI-assisted analysis using Gemini, OpenRouter, Anthropic, or Amazon Bedrock.
- Optional S3-compatible storage such as Cloudflare R2 for scan artifacts and reports.

The frontend communicates with the backend over HTTP. The backend stores application state in PostgreSQL, uses Redis for queues and caching, and delegates longer-running scans to Celery workers.

## Technology stack

### Backend

- Python 3.11+
- Django 5.1 and Django REST Framework
- PostgreSQL, Redis, Celery, and Celery Beat
- Django Channels/Daphne for realtime-capable services
- Gunicorn and WhiteNoise for production serving
- Boto3 for S3-compatible object storage

### Frontend

- Next.js 14, React 18, and TypeScript
- Tailwind CSS and Radix UI
- Recharts and related reporting libraries

### Deployment

- Docker and Docker Compose
- PostgreSQL and Redis containers
- Separate production images for the Django API, Next.js dashboard, and optional scan toolbox

## Prerequisites

For Docker deployment:

- Docker Desktop or Docker Engine with Docker Compose v2
- At least 4 GB of memory available to Docker; scans may need more

For standalone development:

- Python 3.11 or newer
- Node.js 18 or newer and npm
- PostgreSQL and Redis, unless using the local development defaults supported by the backend

Optional integrations may require credentials or installed tooling for S3/R2, AI providers, MobSF, GitHub, or external reconnaissance tools.

## Quick start with Docker

From the repository root:

```bash
docker compose -f backend/docker-compose.yml up --build
```

The stack starts:

| Service | Purpose | Address |
| --- | --- | --- |
| `postgres` | Application database | Internal only |
| `redis` | Queue and cache backend | Internal only |
| `web` | Django API and admin | http://localhost:8000 |
| `celery_worker` | Background scan execution | Internal only |
| `celery_beat` | Scheduled task execution | Internal only |
| `dashboard` | Next.js production UI | http://localhost:3000 |

The backend container runs `collectstatic` and database migrations on startup. Django admin is available at `http://localhost:8000/admin/`.

Stop the stack with:

```bash
docker compose -f backend/docker-compose.yml down
```

To also remove local PostgreSQL volume data:

```bash
docker compose -f backend/docker-compose.yml down -v
```

The second command deletes the local database volume, so use it only when that data is disposable.

### Optional scan toolbox

The toolbox is a build-only image used by containerized reconnaissance scans:

```bash
docker compose -f backend/docker-compose.yml --profile build build toolbox
```

Configure `RECON_EXECUTION_BACKEND=docker` when using the Docker-based scan runtime.

## Environment configuration

Environment files are intentionally excluded from Git. Start from the committed examples:

```bash
cp backend/sample.env backend/.env
cp frontend/sample.env frontend/.env.local
```

On Windows PowerShell, use `Copy-Item backend\sample.env backend\.env` and `Copy-Item frontend\sample.env frontend\.env.local`.

### Backend configuration

The main backend settings are in `backend/sample.env`. Important groups include:

- `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` for core services.
- `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, and `CSRF_AND_CORS_URLS` for Django security and browser access.
- `LLM_API_URL`, `LLM_MODEL_NAME`, `GEMINI_API_KEY`, and `OPENROUTER_API_KEY` for AI features.
- `RECON_AI_PROVIDER` and `BEDROCK_RECON_MODEL` for AI-assisted recon.
- `RECON_EXECUTION_BACKEND`, `RECON_TOOLBOX_IMAGE`, and resource limits for scan execution.
- `S3_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and bucket variables for artifact storage.
- `MOBSF_URL` and `MOBSF_API_KEY` for mobile analysis integration.
- `SMTP_*` variables for email delivery.

Docker Compose provides development-safe defaults for many values. Replace default secrets before using the application outside local development.

### Frontend configuration

The frontend uses `frontend/sample.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

`NEXT_PUBLIC_API_BASE_URL` is embedded into the browser bundle at build time, so it must be reachable from the user’s browser. Do not set it to a Docker-internal hostname such as `http://web:8000` when accessing the dashboard from the host machine.

For Docker, set it on the host if the default is not appropriate. In PowerShell:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "https://api.example.com"
docker compose -f backend/docker-compose.yml up --build
```

## Standalone backend development

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item sample.env .env
python manage.py migrate
python manage.py runserver
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp sample.env .env
python manage.py migrate
python manage.py runserver
```

Run the worker in another terminal when asynchronous scans are needed:

```bash
cd backend
celery -A trilux.celery worker --loglevel=info
```

Run scheduled tasks when needed:

```bash
cd backend
celery -A trilux.celery beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Standalone frontend development

In a second terminal from the repository root:

```bash
cd frontend
npm install
cp sample.env .env.local
npm run dev
```

On PowerShell, use `Copy-Item sample.env .env.local`. The dashboard runs at http://localhost:3000 and expects the backend at the URL configured by `NEXT_PUBLIC_API_BASE_URL`.

For a production-style frontend build:

```bash
npm run build
npm run start
```

## Development commands

Backend checks and tests:

```bash
cd backend
python manage.py check
python manage.py test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Data, storage, and secrets

Never commit `.env`, API keys, cloud credentials, passwords, private keys, production databases, request logs, or generated dependency/build directories. The repository `.gitignore` covers standard local versions of these files, but verify new integrations before committing.

Docker stores PostgreSQL data in the named `postgres_data` volume and shared recon work in `recon_work`. Uploaded media and collected static files are mounted from `backend/media` and `backend/staticfiles` when those directories exist locally.

## Repository conventions

- Backend source and Docker orchestration live under `backend/`.
- Frontend source and its production image live under `frontend/`.
- Compose paths are written for this unified layout; the dashboard build context defaults to `../frontend` relative to `backend/docker-compose.yml`.
- Keep provider credentials in deployment environment variables or a secret manager.
- Use Django migrations for schema changes and keep migration files under version control.

## Troubleshooting

### Dashboard cannot reach the API

Confirm that `NEXT_PUBLIC_API_BASE_URL` points to a URL reachable by the browser, the backend is running on port 8000, and backend CORS/CSRF settings include the dashboard origin.

### Containers start but scans do not run

Confirm that Redis is healthy, `celery_worker` is running, and required scan-provider credentials/tools are configured. For Docker-based recon, build the toolbox image and ensure Docker socket access is available to the worker.

### Database or migration errors

Check the web container logs:

```bash
docker compose -f backend/docker-compose.yml logs -f web
```

The web container runs migrations automatically by default. For a clean disposable local database, stop the stack with `down -v` and start it again.

### Frontend build failures

Remove local dependencies and rebuild them if the lockfile or Node version changed:

```bash
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

On PowerShell, use `Remove-Item -Recurse -Force node_modules, .next`.

## Security and responsible use

This repository contains security-analysis functionality. Use scanners and reconnaissance tools only against systems you own or are explicitly authorized to test. Review third-party tool and template licenses before redistribution. Add a project-specific license and security policy before sharing the repository outside your trusted team.
