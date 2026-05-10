"""Shared fixtures for integration tests.

Each test function receives a fresh `db_session` backed by a real PostgreSQL
connection. All writes are rolled back (via connection-pool reset) when the
session closes — no explicit teardown required per test.

Set TEST_DATABASE_URL to target a dedicated test database. Falls back to
DATABASE_URL from app settings (development database).
"""
import os

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base


def _test_db_url() -> str:
    if url := os.getenv("TEST_DATABASE_URL"):
        return url
    from app.core.config import get_settings

    return get_settings().DATABASE_URL


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
