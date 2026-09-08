# Obsedian Guard / Trilux — Dashboard

The web UI for the **Obsedian Guard / Trilux** security-scanning platform. A
**Next.js 14 + TypeScript + Tailwind + Radix UI** single-page client that talks to the
Trilux Django backend over its REST API. It is a pure API client: it holds no database
of its own and authenticates with JWT.

The backend lives in the sibling directory (`../backend`).

---

## Run with the unified stack (recommended)

The easiest way to run the whole platform is from the repository root. Run:

```bash
cd ..
docker compose -f backend/docker-compose.yml up --build
```

That builds and serves this dashboard automatically at **http://localhost:3000**,
wired to the backend API on `http://localhost:8000`. See the backend README for details.

---

## Run standalone (dev)

To run just the dashboard against an already-running backend:

```bash
npm install

# Point at the backend (copy sample.env -> .env.local and edit if needed)
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev          # http://localhost:3000
```

This requires the **backend running on http://localhost:8000** (the browser calls it
directly). Other scripts: `npm run build`, `npm run start` (production), `npm run lint`.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the Trilux backend (e.g. `http://localhost:8000`). **Inlined at build time** by Next (the browser hits the backend directly), so it must be the host-reachable URL, not a docker-internal name. |
| `API_PROXY_DESTINATION` | No | If set, enables a Next.js rewrite proxying `/api/*` to `<dest>/api/*` (see `next.config.mjs`). Optional — the app normally calls the backend directly. |

---

## Auth flow

JWT-based, handled client-side:

1. Login (`/login`) calls `POST /auth/signin/` and receives access + refresh tokens.
2. Tokens are stored via `utils/tokenManager.ts` — in `localStorage` when "Remember me"
   is checked, otherwise `sessionStorage`.
3. Authenticated pages are wrapped in `utils/withAuth.tsx`, which:
   - reads the access token, checks expiry (decodes the JWT `exp`),
   - refreshes via the refresh token when expired,
   - validates against `POST /auth/validate-token/`,
   - re-checks periodically and on tab focus, redirecting to `/login` if invalid.
4. API requests send `Authorization: Bearer <access>`.

---

## Pages / feature map

Routes live under `app/` (App Router). Nav is in `components/Sidebar.tsx`.

| Route | Feature |
|-------|---------|
| `/` | Dashboard overview. |
| `/project` | Projects (register/manage scan targets). |
| `/recon` | **Dynamic Testing** — the recon pipeline: list runs + start a scan (`NewReconScanDialog`). Drives the backend `/recon/` endpoints. |
| `/recon/[uuid]` | Run detail: the 12 pipeline steps, findings, and the AI summary. |
| `/dynamic-analysis` | Redirects to `/recon` (consolidated into Dynamic Testing). |
| `/static-analysis` | Static analysis (SAST). |
| `/vulnerability` | Vulnerabilities view. |
| `/mobile-app-testing` | Mobile app (APK/IPA) analysis — create / history / reports. |
| `/api-testing` | API testing — create / history / reports. |
| `/browser-extension-testing` | Browser extension analysis — create / history / reports. |
| `/llm-testing` | LLM testing gateway — gateway / history / reports. |
| `/pr-review` | PR review — reviews / queue / analytics / settings. |
| `/security-researcher` | Security researcher hub (chat, knowledge base, trends, metrics, etc.). |
| `/reports` | Reports. |
| `/security-policies`, `/access-control`, `/sercurity-alerts`, `/settings` | Management. |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth screens. |

---

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI** primitives, **lucide-react** icons
- **react-hook-form** + **zod** (forms/validation), **recharts** (charts),
  **framer-motion** (animation), **jspdf** (report export)

## Project structure

```
app/          Next.js App Router pages (one folder per feature route)
components/   UI components (Sidebar, dialogs, ui/ primitives, features/)
utils/        Auth helpers — tokenManager.ts, withAuth.tsx, authUtils.ts
lib/          Shared utilities (utils.ts)
public/       Static assets
Dockerfile    Production build (used by the backend's docker compose stack)
next.config.mjs   Image domains + optional API proxy rewrite
```
