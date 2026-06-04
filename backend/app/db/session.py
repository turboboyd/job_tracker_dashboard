import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

logger = logging.getLogger(__name__)

_engine = None
_async_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        from app.core.config import get_settings

        settings = get_settings()
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.is_development,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    return _engine


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_factory


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Public accessor for the shared session factory.

    Use this for work outside the request/response cycle (background tasks,
    schedulers) that needs its own short-lived session.
    """
    return _get_session_factory()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a per-request AsyncSession."""
    factory = _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


DbSession = Annotated[AsyncSession, Depends(get_db)]


async def check_db_connection() -> bool:
    """Probe the database with SELECT 1. Returns True if reachable, False otherwise."""
    try:
        engine = _get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("DB connection probe failed: %s", exc)
        return False
