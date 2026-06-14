"""Tests for the backend Firebase verifier selection and the DEV/QA-only
Firebase Auth Emulator verifier (Stage 5b).

These tests are hermetic: they never reach the network and never require real
Firebase credentials. The emulator-mode verification test builds an unsigned
(`alg: none`) JWT by hand — exactly the shape the Firebase Auth Emulator emits —
and confirms firebase-admin decodes it without a signature/cert/network check.
"""

import base64
import json
import time

import pytest

from app.auth.firebase import (
    EmulatorFirebaseVerifier,
    NotConfiguredVerifier,
    RealFirebaseVerifier,
    _build_verifier,
)
from app.core.config import Settings, get_settings

_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/job_tracker"
_EMULATOR_HOST = "127.0.0.1:9099"
_PROJECT_ID = "demo-job-tracker"

# Environment variables this module mutates (directly or via firebase-admin).
# The autouse fixture snapshots and restores them so the broader suite is never
# left in emulator mode.
_MANAGED_ENV = (
    "FIREBASE_AUTH_EMULATOR_HOST",
    "GOOGLE_CLOUD_PROJECT",
    "GCLOUD_PROJECT",
)


def _delete_all_firebase_apps() -> None:
    import firebase_admin

    for app in list(firebase_admin._apps.values()):
        firebase_admin.delete_app(app)


@pytest.fixture(autouse=True)
def _reset_firebase_state():
    """Isolate global firebase-admin / cache / env state around each test.

    firebase-admin keeps a process-wide app registry and reads the emulator
    host from os.environ, and both `get_settings` and `_build_verifier` are
    lru_cached. Without this reset, tests would leak emulator mode into the rest
    of the suite.
    """
    import os

    saved_env = {key: os.environ.get(key) for key in _MANAGED_ENV}
    for key in _MANAGED_ENV:
        os.environ.pop(key, None)

    _build_verifier.cache_clear()
    get_settings.cache_clear()
    _delete_all_firebase_apps()

    yield

    _delete_all_firebase_apps()
    _build_verifier.cache_clear()
    get_settings.cache_clear()
    for key, value in saved_env.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value


def _make_settings(**overrides) -> Settings:
    """Build a Settings object from explicit kwargs.

    Init kwargs have the highest precedence in pydantic-settings, so this is
    deterministic regardless of any local .env file or ambient environment.
    """
    values = {"DATABASE_URL": _DATABASE_URL}
    values.update(overrides)
    return Settings(**values)


def _patch_settings(monkeypatch, settings: Settings) -> None:
    # `_build_verifier` does `from app.core.config import get_settings` at call
    # time, so patching the attribute on the module is sufficient.
    monkeypatch.setattr("app.core.config.get_settings", lambda: settings)
    _build_verifier.cache_clear()


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _make_emulator_token(project_id: str, **claim_overrides) -> str:
    """Construct an unsigned Firebase Auth Emulator ID token (`alg: none`)."""
    header = {"alg": "none", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "iss": f"https://securetoken.google.com/{project_id}",
        "aud": project_id,
        "auth_time": now,
        "user_id": "emu-user-123",
        "sub": "emu-user-123",
        "iat": now,
        "exp": now + 3600,
        "firebase": {"identities": {}, "sign_in_provider": "password"},
    }
    payload.update(claim_overrides)
    header_segment = _b64url(json.dumps(header).encode("utf-8"))
    payload_segment = _b64url(json.dumps(payload).encode("utf-8"))
    # Empty signature segment — exactly what the emulator's _EmulatedSigner emits.
    return f"{header_segment}.{payload_segment}."


# ── Verifier selection ───────────────────────────────────────────────────────


def test_emulator_host_in_development_returns_emulator_verifier(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", _PROJECT_ID)
    _patch_settings(
        monkeypatch,
        _make_settings(
            ENVIRONMENT="development",
            FIREBASE_AUTH_EMULATOR_HOST=_EMULATOR_HOST,
            FIREBASE_CREDENTIALS_JSON_PATH="",
        ),
    )

    verifier = _build_verifier()

    assert isinstance(verifier, EmulatorFirebaseVerifier)


def test_emulator_mode_does_not_require_credentials(monkeypatch):
    # No credentials path set, yet emulator mode is selected (not NotConfigured).
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", _PROJECT_ID)
    _patch_settings(
        monkeypatch,
        _make_settings(
            ENVIRONMENT="development",
            FIREBASE_AUTH_EMULATOR_HOST=_EMULATOR_HOST,
            FIREBASE_CREDENTIALS_JSON_PATH="",
        ),
    )

    verifier = _build_verifier()

    assert isinstance(verifier, EmulatorFirebaseVerifier)
    assert not isinstance(verifier, NotConfiguredVerifier)


def test_no_emulator_no_credentials_returns_not_configured(monkeypatch):
    _patch_settings(
        monkeypatch,
        _make_settings(
            ENVIRONMENT="development",
            FIREBASE_AUTH_EMULATOR_HOST="",
            FIREBASE_CREDENTIALS_JSON_PATH="",
        ),
    )

    verifier = _build_verifier()

    assert isinstance(verifier, NotConfiguredVerifier)


def test_credentials_path_without_emulator_returns_real_verifier(monkeypatch):
    _patch_settings(
        monkeypatch,
        _make_settings(
            ENVIRONMENT="development",
            FIREBASE_AUTH_EMULATOR_HOST="",
            FIREBASE_CREDENTIALS_JSON_PATH="/run/secrets/firebase.json",
        ),
    )

    verifier = _build_verifier()

    assert isinstance(verifier, RealFirebaseVerifier)


def test_emulator_host_without_project_id_raises_runtime_error(monkeypatch):
    # No GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT in the environment (cleared by the
    # autouse fixture). The verifier is still returned, but verification fails
    # with a RuntimeError — which deps.get_current_user maps to a 503
    # configuration failure, not a generic 500.
    _patch_settings(
        monkeypatch,
        _make_settings(
            ENVIRONMENT="development",
            FIREBASE_AUTH_EMULATOR_HOST=_EMULATOR_HOST,
            FIREBASE_CREDENTIALS_JSON_PATH="",
        ),
    )

    verifier = _build_verifier()
    assert isinstance(verifier, EmulatorFirebaseVerifier)

    with pytest.raises(RuntimeError, match="no Firebase project id"):
        verifier.verify_id_token(_make_emulator_token(_PROJECT_ID))


# ── Hermetic emulator-mode verification (no network, no credentials) ─────────


def test_emulator_verifier_decodes_unsigned_token(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", _PROJECT_ID)
    verifier = EmulatorFirebaseVerifier(_EMULATOR_HOST, _PROJECT_ID)

    token = _make_emulator_token(
        _PROJECT_ID,
        sub="dev-user-42",
        user_id="dev-user-42",
        email="dev@example.com",
        name="Dev User",
        picture="https://example.com/avatar.png",
    )

    decoded = verifier.verify_id_token(token)

    assert decoded["firebase_uid"] == "dev-user-42"
    assert decoded["email"] == "dev@example.com"
    assert decoded["display_name"] == "Dev User"
    assert decoded["photo_url"] == "https://example.com/avatar.png"


def test_emulator_verifier_rejects_wrong_audience(monkeypatch):
    # Defense-in-depth: even in emulator mode, a token for a different project
    # (wrong aud/iss) must be rejected. Proves this is not an accept-anything
    # bypass. The verifier wraps verification failures as ValueError, which
    # deps.get_current_user maps to 401.
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", _PROJECT_ID)
    verifier = EmulatorFirebaseVerifier(_EMULATOR_HOST, _PROJECT_ID)

    foreign_token = _make_emulator_token("some-other-project")

    with pytest.raises(ValueError, match="verification failed"):
        verifier.verify_id_token(foreign_token)
