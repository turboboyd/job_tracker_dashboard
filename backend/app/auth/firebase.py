"""Firebase Auth verification abstraction.

Design:
- `DecodedFirebaseToken` — typed dict for decoded token claims.
- `IFirebaseVerifier` — Protocol (structural interface) for token verification.
  This allows tests to inject a mock without subclassing.
- `RealFirebaseVerifier` — lazy-init wrapper around firebase-admin SDK.
- `NotConfiguredVerifier` — returned when no credentials path is set.
- `get_verifier()` — FastAPI dependency; override it in tests via
  `app.dependency_overrides[get_verifier] = lambda: MyMockVerifier()`.
"""

import functools
import logging
from typing import Protocol, TypedDict

logger = logging.getLogger(__name__)


class DecodedFirebaseToken(TypedDict):
    firebase_uid: str
    email: str | None
    display_name: str | None
    photo_url: str | None


class IFirebaseVerifier(Protocol):
    """Structural interface for Firebase ID-token verification.

    Any object implementing `verify_id_token(token: str) -> DecodedFirebaseToken`
    satisfies this protocol — no inheritance required.
    """

    def verify_id_token(self, token: str) -> DecodedFirebaseToken: ...


class RealFirebaseVerifier:
    """Production verifier using the firebase-admin SDK.

    Lazy-initialises the Firebase Admin app on first call so that
    importing this module does not require credentials to be present.
    """

    def __init__(self, credentials_path: str) -> None:
        self._credentials_path = credentials_path
        self._ready = False

    def _ensure_ready(self) -> None:
        if self._ready:
            return
        try:
            import firebase_admin
            from firebase_admin import credentials

            if not firebase_admin._apps:
                cred = credentials.Certificate(self._credentials_path)
                firebase_admin.initialize_app(cred)
            self._ready = True
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialise Firebase Admin SDK "
                f"(credentials: {self._credentials_path!r}): {exc}"
            ) from exc

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        self._ensure_ready()
        from firebase_admin import auth

        try:
            decoded = auth.verify_id_token(token)
        except Exception as exc:
            raise ValueError(f"Firebase token verification failed: {exc}") from exc

        return DecodedFirebaseToken(
            firebase_uid=decoded["uid"],
            email=decoded.get("email"),
            display_name=decoded.get("name"),
            photo_url=decoded.get("picture"),
        )


class NotConfiguredVerifier:
    """Returned when FIREBASE_CREDENTIALS_JSON_PATH is not set.

    Calling verify_id_token raises RuntimeError which deps.py maps to 503.
    """

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        raise RuntimeError(
            "Firebase Auth is not configured. "
            "Set FIREBASE_CREDENTIALS_JSON_PATH in your environment."
        )


@functools.lru_cache(maxsize=1)
def _build_verifier() -> IFirebaseVerifier:
    from app.core.config import get_settings

    settings = get_settings()
    path = settings.FIREBASE_CREDENTIALS_JSON_PATH

    if not path:
        logger.warning(
            "FIREBASE_CREDENTIALS_JSON_PATH is not set — "
            "all auth requests will be rejected with 503."
        )
        return NotConfiguredVerifier()

    return RealFirebaseVerifier(path)


def get_verifier() -> IFirebaseVerifier:
    """FastAPI dependency: returns the singleton Firebase verifier.

    Override in tests::

        app.dependency_overrides[get_verifier] = lambda: MyMockVerifier()
    """
    return _build_verifier()
