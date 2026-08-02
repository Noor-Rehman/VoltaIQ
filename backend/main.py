"""
backend/main.py
----------------
VoltaIQ FastAPI application entry point.

Run with:
    uvicorn backend.main:app --reload --port 8000

Then open:
    http://localhost:8000          → health check
    http://localhost:8000/docs     → Swagger UI (all endpoints)
    http://localhost:8000/redoc    → ReDoc UI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import test_connection
from backend.routers import predict, feeders, schedule

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "VoltaIQ API",
    description = "AI-powered load-shedding predictor for Islamabad & Rawalpindi",
    version     = "1.0.0",
)

# ── CORS — allow Next.js frontend on port 3000 ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000", "https://volta-iq-tau.vercel.app", "http://127.0.0.1:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(predict.router)
app.include_router(feeders.router)
app.include_router(schedule.router)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health():
    db_ok = test_connection()
    return {
        "status":   "ok",
        "app":      "VoltaIQ API",
        "version":  "1.0.0",
        "database": "connected" if db_ok else "unreachable",
        "docs":     "/docs",
    }