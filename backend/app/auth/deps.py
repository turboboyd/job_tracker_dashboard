"""FastAPI dependencies for authentication."""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.firebase import IFirebaseVerifier, get_verifier
from app.auth.service import ensure_local_user
from app.db.models.user import User
from app.db.session import DbSession

logger = logging.getLogger(__name__)

# auto_error=False so we can return our own 401 format instead of FastAPI's default
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: DbSession,
    verifier: Annotated[IFirebaseVerifier, Depends(get_verifier)],
) -> User:
    """Verify the Bearer token and return (or create) the local user.

    Raises:
        HTTPException 401 — missing or invalid token.
        HTTPException 503 — Firebase not configured (credentials missing on server).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        firebase_user = verifier.verify_id_token(credentials.credentials)
    except RuntimeError as exc:
        # Server misconfiguration — Firebase SDK not initialised
        logger.error("Firebase not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await ensure_local_user(db, firebase_user)


# Convenience alias — inject this in route handlers:
#   async def my_route(current_user: CurrentUser) -> ...:
CurrentUser = Annotated[User, Depends(get_current_user)]
