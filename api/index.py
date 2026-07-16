"""
Vercel Python serverless function entrypoint.

Vercel's @vercel/python runtime looks for a variable named `app` (ASGI)
or `handler` (WSGI) at the module level of this file.

We add `backend/` to sys.path so that `from app.main import app` resolves
to `backend/app/main.py` — the FastAPI application.
"""
import sys
import os

# Make `backend/` importable so `app.main` resolves correctly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import the FastAPI ASGI app — Vercel picks this up automatically
from app.main import app  # noqa: E402  # type: ignore[import-untyped]

# Explicitly re-export so Vercel's runtime can discover it
__all__ = ["app"]
