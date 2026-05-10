from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models.

    Import this in alembic/env.py and in every model module so that
    Alembic can detect schema changes automatically.
    """
