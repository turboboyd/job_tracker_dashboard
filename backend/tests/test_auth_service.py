from typing import Any

import pytest
from sqlalchemy.exc import IntegrityError

from app.auth.service import ensure_local_user
from app.db.models.user import User


class _Result:
    def __init__(self, user: User | None):
        self.user = user

    def scalar_one_or_none(self) -> User | None:
        return self.user


class _FakeSession:
    def __init__(self, results: list[_Result], flush_error: Exception | None = None):
        self.results = results
        self.flush_error = flush_error
        self.added: list[User] = []
        self.executed: list[Any] = []
        self.did_flush = False
        self.did_rollback = False

    async def execute(self, statement: Any) -> _Result:
        self.executed.append(statement)
        return self.results.pop(0)

    def add(self, user: User) -> None:
        self.added.append(user)

    async def flush(self) -> None:
        self.did_flush = True
        if self.flush_error is not None:
            raise self.flush_error

    async def rollback(self) -> None:
        self.did_rollback = True


@pytest.mark.asyncio
async def test_ensure_local_user_returns_existing_user_and_syncs_profile() -> None:
    existing = User(
        firebase_uid="firebase-1",
        email="old@example.test",
        display_name="Old Name",
        photo_url=None,
    )
    db = _FakeSession(results=[_Result(existing)])

    user = await ensure_local_user(
        db,  # type: ignore[arg-type]
        {
            "firebase_uid": "firebase-1",
            "email": "new@example.test",
            "display_name": "New Name",
            "photo_url": "https://example.test/avatar.png",
        },
    )

    assert user is existing
    assert user.email == "new@example.test"
    assert user.display_name == "New Name"
    assert user.photo_url == "https://example.test/avatar.png"
    assert db.added == []
    assert db.did_rollback is False


@pytest.mark.asyncio
async def test_ensure_local_user_creates_missing_user() -> None:
    db = _FakeSession(results=[_Result(None)])

    user = await ensure_local_user(
        db,  # type: ignore[arg-type]
        {
            "firebase_uid": "firebase-new",
            "email": "new@example.test",
            "display_name": "New User",
            "photo_url": None,
        },
    )

    assert user.firebase_uid == "firebase-new"
    assert user.email == "new@example.test"
    assert user.display_name == "New User"
    assert user.analysis_plan == "free"
    assert db.added == [user]
    assert db.did_flush is True
    assert db.did_rollback is False


@pytest.mark.asyncio
async def test_ensure_local_user_rolls_back_and_reselects_after_duplicate_insert() -> None:
    winning_user = User(
        firebase_uid="firebase-race",
        email="winner@example.test",
        display_name="Winner",
        photo_url=None,
    )
    db = _FakeSession(
        results=[_Result(None), _Result(winning_user)],
        flush_error=IntegrityError("INSERT users", {}, Exception("duplicate firebase_uid")),
    )

    user = await ensure_local_user(
        db,  # type: ignore[arg-type]
        {
            "firebase_uid": "firebase-race",
            "email": "fresh@example.test",
            "display_name": "Fresh Name",
            "photo_url": None,
        },
    )

    assert user is winning_user
    assert user.email == "fresh@example.test"
    assert user.display_name == "Fresh Name"
    assert db.did_rollback is True
    assert len(db.executed) == 2


@pytest.mark.asyncio
async def test_ensure_local_user_reraises_integrity_error_if_no_winning_row_exists() -> None:
    db = _FakeSession(
        results=[_Result(None), _Result(None)],
        flush_error=IntegrityError("INSERT users", {}, Exception("other constraint")),
    )

    with pytest.raises(IntegrityError):
        await ensure_local_user(
            db,  # type: ignore[arg-type]
            {
                "firebase_uid": "firebase-broken",
                "email": "broken@example.test",
                "display_name": None,
                "photo_url": None,
            },
        )

    assert db.did_rollback is True
    assert len(db.executed) == 2
