"""User provisioning: map a Firebase identity to a local DB record."""

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken
from app.db.models.user import User

logger = logging.getLogger(__name__)


async def ensure_local_user(db: AsyncSession, firebase_user: DecodedFirebaseToken) -> User:
    """Find or create a local user mapped to the given Firebase identity.

    Behaviour:
    - First call for a firebase_uid → creates a new User row.
    - Subsequent calls → returns the existing User, updating email /
      display_name / photo_url if Firebase reports new values.
    - Concurrent inserts (race condition) → the losing request rolls back
      the failed transaction, re-selects the winning row, and returns it.

    Raises only if the insert fails and no winning row can be found after
    rollback, which indicates a non-race integrity problem.
    """
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_user["firebase_uid"])
    )
    user = result.scalar_one_or_none()

    if user is not None:
        return _sync_firebase_fields(db, user, firebase_user)

    user = _build_user(firebase_user)
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        # A parallel first-load request may have inserted the same firebase_uid
        # after our initial SELECT and before our INSERT.  Once flush fails the
        # SQLAlchemy session is in a failed transaction state, so rollback is
        # mandatory before any further SELECT; otherwise later dependency/route
        # code hits PendingRollbackError.
        await db.rollback()
        result = await db.execute(
            select(User).where(User.firebase_uid == firebase_user["firebase_uid"])
        )
        existing_user = result.scalar_one_or_none()
        if existing_user is None:
            raise

        logger.debug(
            "Concurrent local-user insert detected; using existing user firebase_uid=%r",
            firebase_user["firebase_uid"],
        )
        return _sync_firebase_fields(db, existing_user, firebase_user)

    logger.info("Created local user firebase_uid=%r", firebase_user["firebase_uid"])
    return user


def _build_user(firebase_user: DecodedFirebaseToken) -> User:
    return User(
        firebase_uid=firebase_user["firebase_uid"],
        email=firebase_user.get("email"),
        display_name=firebase_user.get("display_name"),
        photo_url=firebase_user.get("photo_url"),
        analysis_plan="free",
    )


def _sync_firebase_fields(
    db: AsyncSession,
    user: User,
    firebase_user: DecodedFirebaseToken,
) -> User:
    """Update Firebase-sourced profile fields if they changed. Returns the user."""
    updates: dict[str, str | None] = {}
    for attr in ("email", "display_name", "photo_url"):
        new_val = firebase_user.get(attr)  # type: ignore[literal-required]
        if new_val is not None and getattr(user, attr) != new_val:
            updates[attr] = new_val

    if updates:
        for attr, val in updates.items():
            setattr(user, attr, val)
        user.updated_at = datetime.now(UTC)
        logger.debug(
            "Synced Firebase profile fields %s for firebase_uid=%r",
            list(updates),
            user.firebase_uid,
        )

    return user
