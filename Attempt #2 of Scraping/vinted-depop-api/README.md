# Vinted / Depop API (Educational)

Modern FastAPI replacement for the legacy "Vinted-Scraper" CLI. This project
models the same entities, options, and workflows but only uses mock/seed data
so it can be safely explored for educational purposes.

> **Disclaimer**: For educational use only. Always respect marketplace terms of
> service and robots.txt, and never use this code to access private accounts or
> bypass security controls.

## Getting started

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs. Database content is
seeded automatically with sample users and listings.

## API surface

- `GET /health` – heartbeat
- `POST /scrape/vinted` – stub endpoint that simulates scraping by inserting
  placeholder records
- `POST /scrape/depop` – same idea for Depop
- `GET /vinted/users`, `GET /vinted/users/{user_id}`, `GET /vinted/products`
- `GET /depop/users`, `GET /depop/users/{user_id}`, `GET /depop/products`

Each list endpoint accepts helpful filters such as `username`, `brand`, size and
price constraints, or follower counts.

## Legacy CLI bridge

The repository ships with `cli.py`, a Typer-based wrapper that mirrors the
original command flags and simply calls the API endpoints.

Examples (run from repo root while the API is running):

```bash
python cli.py scrape-vinted -u vin_001 -u vin_002 -i 5
python cli.py scrape-depop -u studioflux -g --api-base http://localhost:8000
```

Flag mapping:

- `-p` – legacy "scrape private messages" option; now just logs a notice.
- `-s` – session token; ignored for safety.
- `-u` – user IDs (Vinted) or usernames (Depop).
- `-i` – max images to store per product.
- `-n` – `download_files` flag (documents media handling, no downloads occur).
- `-g` – include sold listings for Depop stubs.
- `-b` – resume/start-from item marker; logged only.

## Project layout

```
app/
  main.py          # FastAPI app and startup hooks
  database.py      # SQLite engine, session dependency
  models.py        # SQLAlchemy ORM definitions
  schemas.py       # Pydantic response/request models
  routers/         # Health, Vinted, Depop route modules
  services/        # Stub scraping + seed helpers
cli.py             # Legacy-friendly CLI wrapper
requirements.txt   # Python dependencies
```

## Educational stance

- No real scraping logic ships in this repo.
- Endpoints only touch bootstrap data or deterministic mock payloads.
- Nothing attempts to log in, bypass security, or download private content.
