import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="session")
def app():
    """Shared FastAPI application instance for the test session."""
    return create_app()


@pytest.fixture
def client(app):
    """Synchronous test client. Does not require a real database."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
