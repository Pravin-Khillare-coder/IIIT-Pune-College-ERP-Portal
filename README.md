# IIIT Pune College ERP Portal

An integrated ERP portal for IIIT Pune that digitizes semester registration for existing students and provides informational guidelines for new admissions.

---

## Technical Stack

* **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router v6, React Hook Form, Zod.
* **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Passlib (Argon2 / bcrypt).
* **Database**: PostgreSQL (with dev SQLite fallback).
* **Storage**: Private Local File Storage abstraction.

---

## Directory Structure

```
ERP/
├── backend/            # FastAPI backend service
│   ├── app/            # Application logic (api, core, models, schemas, services)
│   ├── alembic/        # Database migrations
│   ├── tests/          # Pytest test suite
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/           # React + Vite + TypeScript frontend application
│   ├── src/            # Components, pages, services, types
│   ├── package.json
│   └── vite.config.ts
├── storage/            # Private document upload repository
└── README.md
```

---

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend API will be accessible at: `http://localhost:8000`
API OpenAPI Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend application will be accessible at: `http://localhost:5173`

---

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "Initial schema setup"
alembic upgrade head
```

---

## Testing

```bash
cd backend
pytest
```
