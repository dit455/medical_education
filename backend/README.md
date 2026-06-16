# EMS Backend (Flask + MySQL)

Serves the Institutions / Courses / Subjects hierarchy for the BOME/BOEN
board dashboard from the `ems_dev` MySQL database (schema in
`../DB Files/ems_master.sql`, seed data in `../DB Files/seed_data.sql`).

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux
pip install -r requirements.txt
```

## Configure

Copy `.env.example` to `.env` (or just export the variables in your shell)
and adjust if your MySQL credentials differ from the defaults:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ems_dev
```

## Run

```bash
python app.py
```

The API listens on `http://localhost:5000` with all routes under `/api`,
and allows CORS from the Vite dev server (`http://localhost:5173` and
`http://127.0.0.1:5173`).

Quick check:

```bash
curl http://localhost:5000/api/institutions?board=BOME
```
