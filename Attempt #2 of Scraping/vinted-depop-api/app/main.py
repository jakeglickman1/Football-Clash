from contextlib import contextmanager

from fastapi import FastAPI

from .database import SessionLocal, init_db
from .routers import depop, health, vinted
from .services.depop_service import seed_depop_data
from .services.vinted_service import seed_vinted_data

app = FastAPI(
    title="Encore Vinted/Depop API",
    version="0.1.0",
    description=(
        "Educational API that models the legacy Vinted-Scraper tool without"
        " performing real scraping on private data."
    ),
)

app.include_router(health.router)
app.include_router(vinted.router)
app.include_router(depop.router)


@contextmanager
def session_scope():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    init_db()
    with session_scope() as db:
        seed_vinted_data(db)
        seed_depop_data(db)


@app.get("/", include_in_schema=False)
def root():
    return {"message": "Encore resale intelligence API", "docs": "/docs"}
