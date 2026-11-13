# Vulnerability Tracker API

The backend is a FastAPI application using SQLAlchemy's async engine and PostgreSQL.

## Requirements

- Python 3.11 or newer
- PostgreSQL

The Python application and its virtual environment are currently located in `venv/`.

## Setup on Windows

Open PowerShell in `Project/server/venv` and install the dependencies:

```powershell
.\Scripts\Activate.ps1
python -m pip install -r .\requiremnts.txt
```

Set `DATABASE_URL` to your PostgreSQL async connection URL before starting the API:

```powershell
$env:DATABASE_URL = "postgresql+asyncpg://USER:PASSWORD@localhost:5432/vulnearability_tracker"
```

Start the development server:

```powershell
.\run.ps1
```

The API listens on `http://127.0.0.1:8000` by default. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Available endpoints

- `GET /` — API welcome message
- `POST /api/v1/auth/register` — create a user account

The development CORS configuration allows the frontend at `http://localhost:3000` and `http://127.0.0.1:3000`.

## Repository note

`venv/` is the current backend source directory name, but a Python virtual environment should not normally be committed. Only the application source, dependency list, and launch instructions are tracked; the environment binaries, installed packages, and local `.env` file are excluded.
