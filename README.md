# Trilux Platform

Trilux is a security analysis platform with a Django backend and a Next.js dashboard.

## Repository layout

- `backend/` — Django API, background tasks, scanners, and server-side services.
- `frontend/` — Next.js dashboard for interacting with the API.

## Prerequisites

- Python 3.11+ and a virtual environment
- Node.js 18+ and npm
- PostgreSQL and Redis for a full deployment (SQLite/in-memory defaults may be used for local development when supported by the environment files)

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item sample.env .env
python manage.py migrate
python manage.py runserver
```

Review `backend/sample.env` and set the values appropriate for your environment. Never commit `.env` or real API keys.

## Frontend setup

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item sample.env .env
npm run dev
```

Review `frontend/sample.env` and point `NEXT_PUBLIC_API_BASE_URL` at the running backend.

## Production notes

From the repository root, start the full stack with `docker compose -f backend/docker-compose.yml up --build`. Configure secrets through the deployment environment, not source control.
