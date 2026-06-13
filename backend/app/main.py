"""
FastAPI application entry point.

Run locally:
    uvicorn app.main:app --reload --port 8000

The app mounts all routers under /api/* and configures CORS so the
React frontend (default Vite port 5173) can call it during development.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, users, advances, admin

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="GovPay Uganda API",
    description="Backend for the GovPay Uganda salary-advance platform.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(advances.router)
app.include_router(admin.router)


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["meta"])
def root():
    return {
        "project": "GovPay Uganda",
        "description": "Salary advance platform for Ugandan public servants — Ministry of Finance.",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "GovPay Uganda API"}
