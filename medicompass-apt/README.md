# Medicompass API (FastAPI + MySQL)

Python backend for the Medicompass (迈蒂康) cross-border medical-travel platform.
It replaces the original Next.js API routes / Prisma layer; the Next.js app is now
a pure presentation layer that calls these endpoints.

## Tech stack

- **FastAPI** + Uvicorn (async, auto OpenAPI docs at `/docs`)
- **SQLAlchemy 2.x** + PyMySQL (MySQL 8.0+)
- **Pydantic v2** (camelCase JSON responses)
- **python-jose** (JWT session) + **passlib[bcrypt]** (password hashing, compatible with the original bcryptjs hashes)
- **anthropic** SDK (AI medical-record summarization)

## Prerequisites

- Python 3.10+
- MySQL 8.0+

## Setup

```bash
cd medicompass-api

# 1. Virtual env + dependencies
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
copy .env.example .env        # Windows  (cp on macOS/Linux)
#   - set DATABASE_URL to your MySQL
#   - set AUTH_SECRET:  python -c "import secrets; print(secrets.token_urlsafe(48))"
#   - set ADMIN_USERNAME / ADMIN_PASSWORD
#   - (optional) ANTHROPIC_API_KEY for the AI summary feature

# 3. Create the database + tables
#    Create the schema first (in MySQL), e.g.:
#      CREATE DATABASE medicompass CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
#    Then run the DDL:
mysql -u root -p medicompass < mysql_schema.sql

# 4. Seed the default admin
python -m scripts.seed_admin

# 5. Run the API (port 8000)
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API docs.

## API endpoints

Responses are JSON in **camelCase**. Admin endpoints require the
`mc_admin_session` cookie (set by `/api/admin/login`).

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/applications` | public | Submit a second-opinion application (multipart + files); triggers AI summary |
| POST | `/api/inquiries` | public | Submit a service inquiry (JSON) |
| POST | `/api/register/patient` | public | Patient registration |
| POST | `/api/register/provider` | public | Provider/organization registration |
| POST | `/api/register/doctor` | public | Doctor registration |
| POST | `/api/admin/login` | public | Login → sets session cookie |
| POST | `/api/admin/logout` | public | Clear session cookie |
| GET | `/api/admin/applications` | admin | List applications (+ attachment count, AI status) |
| GET | `/api/admin/applications/{id}` | admin | Application detail (+ attachments) |
| POST | `/api/admin/applications/{id}/summarize` | admin | (Re)generate AI summary |
| GET | `/api/admin/inquiries` | admin | List inquiries |
| GET | `/api/admin/attachments/{id}?download=1` | admin | Stream / download an attachment |

## Notes

- **Uploads** are stored on local disk under `data/uploads/<applicationId>/`
  (mirrors the original app). Not suitable for serverless / multi-host —
  swap `app/services/storage.py` for object storage (S3/R2/OSS) there.
- **AI summary** runs fire-and-forget on submit (FastAPI `BackgroundTasks`) and
  synchronously on the admin "regenerate" endpoint. Requires `ANTHROPIC_API_KEY`;
  without it the application is stored and `ai_summary_status` is set to `failed`
  with an explanatory `ai_summary_error`.
- **CORS + cookies**: The frontend proxies `/api/*` to this backend via Next.js
  `rewrites` (same-origin), so cross-site cookie/CORS problems don't arise —
  the `mc_admin_session` cookie (`SameSite=Lax`) is sent automatically. CORS is
  still configured (`FRONTEND_ORIGIN`, default `http://localhost:3001`,
  `allow_credentials=True`) as a fallback for direct browser calls. Under HTTPS,
  set `COOKIE_SECURE=true`.
- The ORM models match `mysql_schema.sql` exactly; the app does **not**
  auto-create tables — run the DDL to manage the schema.
