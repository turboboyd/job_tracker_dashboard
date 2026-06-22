"""Reliable local dev runner for the backend API.

Starts uvicorn on 127.0.0.1:8001 — the port the React dev server's REST gateway
expects (``src/shared/config/backendConfig.ts``) — using THIS Python
interpreter, so the Firebase Admin SDK and every other dependency are guaranteed
to be the ones installed in the active environment.

Why this exists
---------------
The historic ``503 Authentication service is not configured`` failures came from
an environment mismatch: ``uvicorn`` (or its ``--reload`` child process on
Windows) ran under a Python that did not have ``firebase-admin`` installed, so
the verifier raised ``RuntimeError`` -> the API returned 503 instead of a clean
401. This launcher removes the ambiguity:

* it runs in-process with the interpreter you invoke it with (no PATH lookup for
  a stray ``uvicorn.exe`` from a different environment), and
* it fails fast with an actionable message if ``firebase-admin`` is missing here,
  instead of letting every protected endpoint return a cryptic 503 later.

Usage (from backend/, with the venv's Python active)
----------------------------------------------------
    python -m scripts.run_dev            # 127.0.0.1:8001, no autoreload
    python -m scripts.run_dev --reload   # opt-in autoreload (uses this same interpreter)
    python scripts/run_dev.py --port 8002

``--reload`` is OFF by default: it is convenient, but it spawns a child process,
and the lazily-built Firebase verifier is cached per process, so an ``.env``
credential change is only picked up after a full restart anyway.
"""
import argparse
import os
import sys
from pathlib import Path

# backend/ — make ``app`` importable and ensure .env / relative storage paths
# (DOCUMENT_STORAGE_ROOT) resolve regardless of the caller's working directory.
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)


def _preflight() -> None:
    """Fail fast on a misconfigured environment, before binding the port."""
    try:
        import firebase_admin  # noqa: F401
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "\n[run_dev] firebase-admin is NOT installed in this Python "
            f"environment ({sys.executable}).\n"
            "          Every protected endpoint would return 503. Install the "
            "backend deps into THIS interpreter:\n"
            '              python -m pip install -e ".[dev]"\n'
            f"          (import error: {exc})\n"
        )

    try:
        import tzdata  # noqa: F401
    except ModuleNotFoundError:
        # Non-fatal: only the scheduler's Berlin-midnight alignment needs it.
        print(
            "[run_dev] WARNING: tzdata is not installed in this environment; "
            'the scheduler cannot resolve "Europe/Berlin". Install it with '
            '`python -m pip install -e .` or `python -m pip install tzdata`.',
            file=sys.stderr,
        )

    # Surface the auth posture up front so a 503/401 later is never a surprise.
    from app.core.config import get_settings

    cred = (get_settings().FIREBASE_CREDENTIALS_JSON_PATH or "").strip()
    if not cred:
        print(
            "[run_dev] NOTE: FIREBASE_CREDENTIALS_JSON_PATH is empty in "
            "backend/.env — protected endpoints will return 503 until it is set."
        )
    elif not Path(cred).exists():
        print(
            f"[run_dev] WARNING: FIREBASE_CREDENTIALS_JSON_PATH points at a "
            f"missing file: {cred}\n"
            "          Protected endpoints will return 503 until the path is valid."
        )
    else:
        print(f"[run_dev] Firebase credentials OK: {cred}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable autoreload (spawns a child process using this interpreter).",
    )
    parser.add_argument("--log-level", default="info")
    args = parser.parse_args()

    _preflight()

    import uvicorn

    print(f"[run_dev] starting uvicorn on http://{args.host}:{args.port}  "
          f"(reload={'on' if args.reload else 'off'})")
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
