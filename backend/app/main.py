import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from app.api import chat, navigation, dashboard, incident, simulator, match

# ── Allowed origins: tighten for production ───────────────────────────────────
# Set ALLOWED_ORIGINS env var in production (comma-separated URLs).
# Defaults to localhost for local development.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:4173",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(
    title="FanFlow AI Backend API",
    description=(
        "Generative AI-powered Stadium Operations Copilot — Prompt Wars Challenge 4. "
        "Vertical: Smart stadium operations. "
        "Uses Groq LLaMA-3 for structured AI responses with a deterministic fallback layer."
    ),
    version="1.1.0",
    # Disable docs in production if desired: docs_url=None, redoc_url=None
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # No cookies / credentials needed
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Accept-Language", "X-Requested-With"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat.router, prefix="/api/v1")
app.include_router(navigation.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(incident.router, prefix="/api/v1")
app.include_router(simulator.router, prefix="/api/v1")
app.include_router(match.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Liveness probe — returns 200 when the server is running."""
    return {"status": "healthy", "version": "1.1.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

