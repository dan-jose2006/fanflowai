import sys
import os

# Add the backend directory to the Python path so `app.main` is importable
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.main import app  # noqa: E402  # type: ignore[import-untyped]
