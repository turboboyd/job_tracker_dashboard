"""Firebase Auth verification abstraction.

Design:
- `DecodedFirebaseToken` — typed dict for decoded token claims.
- `IFirebaseVerifier` — Protocol (structural interface) for token verification.
  This allows tests to inject a mock without subclassing.
- `RealFirebaseVerifier` — lazy-init wrapper around firebase-admin SDK.
- `EmulatorFirebaseVerifier` — DEV/QA-ONLY verifier for the Firebase Auth
  Emulator. Selected only in development when FIREBASE_AUTH_EMULATOR_HOST is set.
- `NotConfiguredVerifier` — returned when no credentials path is set.
- `get_verifier()` — FastAPI dependency; override it in tests via
  `app.dependency_overrides[get_verifier] = lambda: MyMockVerifier()`.
"""

import functools
import logging
import os
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


class EmulatorFirebaseVerifier:
    """DEV/QA-ONLY verifier that trusts tokens minted by the local Firebase
    Auth Emulator.

    When FIREBASE_AUTH_EMULATOR_HOST is set, firebase-admin skips signature
    verification, certificate fetching, and the network round-trip to Google
    (`verified_claims = payload`). It STILL validates project_id, the `aud`
    (audience) and `iss` (issuer) claims, and a non-empty `sub` claim — so this
    is not an "accept anything" bypass; it only trusts the local emulator's
    signing, exactly as the frontend-issued emulator tokens require.

    This verifier is never selected in production: Stage 5a's config guard
    refuses to boot with a non-empty emulator host, and `_build_verifier`
    additionally requires `settings.is_development`.

    `project_id` may be ``None`` when neither GOOGLE_CLOUD_PROJECT nor
    GCLOUD_PROJECT is set. In that case verification raises ``RuntimeError``,
    which `deps.get_current_user` maps to a 503 (configuration failure) — a
    dev-only misconfiguration signal, without any change to production auth.
    """

    def __init__(self, emulator_host: str, project_id: str | None) -> None:
        self._emulator_host = emulator_host
        self._project_id = project_id
        self._ready = False

    def _ensure_ready(self) -> None:
        if self._ready:
            return
        if not self._project_id:
            raise RuntimeError(
                "FIREBASE_AUTH_EMULATOR_HOST is set but no Firebase project id "
                "was found. Set GOOGLE_CLOUD_PROJECT (or GCLOUD_PROJECT) to your "
                "Firebase project id — it must match the frontend's projectId — "
                "to verify Auth Emulator tokens."
            )
        try:
            import firebase_admin

            # Bridge the pydantic Settings value into os.environ so
            # firebase-admin's is_emulated() returns True at verify time.
            # pydantic-settings does NOT populate os.environ on its own.
            os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = self._emulator_host

            if not firebase_admin._apps:
                # No credential needed in emulator mode; project_id is required
                # so the aud/iss claim validation can run.
                firebase_admin.initialize_app(options={"projectId": self._project_id})
            self._ready = True
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialise Firebase Admin SDK in emulator mode "
                f"(host: {self._emulator_host!r}, project: {self._project_id!r}): {exc}"
            ) from exc

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        self._ensure_ready()
        from firebase_admin import auth

        try:
            decoded = auth.verify_id_token(token)
        except Exception as exc:
            raise ValueError(
                f"Firebase emulator token verification failed: {exc}"
            ) from exc

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

    # ── DEV/QA emulator branch ────────────────────────────────────────────────
    # Activate only when an emulator host is configured AND we are in
    # development. The is_development gate is defense-in-depth: Stage 5a's
    # config guard already forbids a non-empty emulator host in production.
    emulator_host = settings.FIREBASE_AUTH_EMULATOR_HOST.strip()
    if emulator_host and settings.is_development:
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get(
            "GCLOUD_PROJECT"
        )
        logger.warning(
            "Firebase Auth Emulator mode ENABLED (host=%s, project=%s) — tokens "
            "are NOT cryptographically verified. DEV/QA ONLY.",
            emulator_host,
            project_id or "<unset>",
        )
        return EmulatorFirebaseVerifier(emulator_host, project_id)

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
