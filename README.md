# Vulnerability Tracker

Vulnerability Tracker is a web application for recording and reviewing security findings. The repository contains a Next.js frontend and a FastAPI backend backed by PostgreSQL. The dashboard currently uses sample data; it is not yet connected to backend finding-management endpoints.

## Project structure

```text
Design/                         Static HTML/CSS design references
Project/
  client/                       Next.js, React, and TypeScript frontend
  server/
    README.md                   Backend-specific setup notes
    venv/
      app/                      FastAPI application source
      requiremnts.txt            Backend Python dependencies
      run.ps1                    Backend development launcher
```

> **Backend layout:** The Python source currently lives under `Project/server/venv/app`. This is an unusual location: `venv` is also the runtime virtual-environment directory. The source and launch/dependency files are tracked, but the environment binaries, installed packages, and local environment files are not. A future cleanup could move the application source into a conventional `Project/server/app` directory.

## Features

- Landing page, registration page, sign-in page, and dashboard route.
- Registration form connected to the backend registration endpoint.
- FastAPI API with asynchronous SQLAlchemy database access and PostgreSQL support.
- User model and password hashing.
- Dashboard interface with sample findings and users; finding data is currently local mock data.
- Static HTML/CSS design references in `Design/`.

The backend currently exposes `GET /` and `POST /api/v1/auth/register`. The frontend sign-in screen expects an `/auth/login` API, but that endpoint is not implemented in the current backend. Authentication and finding-management behavior should therefore be considered incomplete.

## Requirements

- Node.js and npm
- Python 3.11 or newer
- PostgreSQL

## Run locally (Windows PowerShell)

### 1. Configure PostgreSQL

Create a PostgreSQL database and set its async connection URL in the current PowerShell session. Replace the placeholders with your local database details:

```powershell
$env:DATABASE_URL = "postgresql+asyncpg://USER:PASSWORD@localhost:5432/DATABASE_NAME"
```

Do not commit real credentials. The backend creates its SQLAlchemy tables at application startup.

### 2. Install backend dependencies and start the API

From the repository root:

```powershell
py -m venv Project\server\venv
Project\server\venv\Scripts\Activate.ps1
python -m pip install -r Project\server\venv\requiremnts.txt
python -m pip install argon2-cffi
& .\Project\server\venv\run.ps1
```

The API runs at `http://127.0.0.1:8000`. FastAPI's interactive documentation is at `http://127.0.0.1:8000/docs`.

### 3. Configure and start the frontend

In a second PowerShell window, from the repository root:

```powershell
Set-Location Project\client
npm install
npm run dev
```

Before starting the frontend, create `Project/client/.env.local` with these local API URLs:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000/api/v1
```

Local `.env*` files are ignored by Git.

Open `http://localhost:3000`. The development API CORS configuration allows both `http://localhost:3000` and `http://127.0.0.1:3000`.

## Routes and API

### Frontend

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/register` | Account registration |
| `/login` | Sign-in form (requires a login endpoint not yet present in the backend) |
| `/dashboard` | Dashboard preview with sample users and findings |

### Backend

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | API welcome response |
| `POST` | `/api/v1/auth/register` | Register a user |

The registration endpoint accepts JSON with `full_name`, `user_name`, `email`, and `password`. The backend requires passwords of at least eight characters.

## Development checks

Run the frontend linter from `Project/client`:

```powershell
npm run lint
```

Build the frontend:

```powershell
npm run build
```

Check backend Python syntax from the repository root:

```powershell
Project\server\venv\Scripts\python.exe -m compileall Project\server\venv\app
```

## Notes

- The backend dependency file is currently named `requiremnts.txt` (including the existing spelling); use that exact filename when installing dependencies. The password-hashing helper imports Argon2, so install `argon2-cffi` as shown above.
- Keep secrets and local configuration in ignored `.env` files or environment variables. Never commit database credentials.
- For backend-specific startup details, see [Project/server/README.md](./Project/server/README.md).
