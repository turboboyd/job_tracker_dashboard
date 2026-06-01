"""Shared fixtures for integration tests.

Each test function receives a fresh `db_session` backed by a real PostgreSQL
connection. All writes are rolled back (via connection-pool reset) when the
session closes — no explicit teardown required per test.

Set TEST_DATABASE_URL (env var or backend/.env) to a dedicated, throwaway test
database. The schema fixtures below call create_all/drop_all, so this must NEVER
be the development DATABASE_URL — there is intentionally no fallback to it.
"""
import os

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base


def _test_db_url() -> str:
    """Resolve the integration test database URL.

    Precedence: raw TEST_DATABASE_URL env var (explicit override, e.g. CI) →
    settings.TEST_DATABASE_URL (loaded from backend/.env). We deliberately do
    NOT fall back to DATABASE_URL: the schema fixtures drop_all every table, and
    silently targeting the development database would wipe real data.
    """
    from app.core.config import get_settings

    url = os.getenv("TEST_DATABASE_URL") or get_settings().TEST_DATABASE_URL
    if not url:
        raise RuntimeError(
            "TEST_DATABASE_URL is not set. Integration tests create_all/drop_all "
            "the schema and refuse to run against the development DATABASE_URL. "
            "Set TEST_DATABASE_URL (env var or backend/.env) to a dedicated test "
            "database, e.g. .../job_tracker_test."
        )
    return url


@pytest.fixture(scope="session")
def test_engine():
    return create_async_engine(_test_db_url(), echo=False)


@pytest_asyncio.fixture(scope="session")
async def setup_schema(test_engine):
    """Create all ORM tables once per session; drop on teardown."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(test_engine, setup_schema):
    """Per-test AsyncSession.

    Uncommitted data is rolled back automatically when the connection is
    returned to the pool — each test starts with a clean state.
    """
    factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
