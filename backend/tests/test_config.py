import pytest
from pydantic import ValidationError

from app.core.config import Settings


_TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/job_tracker"


def _production_settings(**overrides):
    values = {
        "ENVIRONMENT": "production",
        "DATABASE_URL": _TEST_DATABASE_URL,
        "FIREBASE_CREDENTIALS_JSON_PATH": "/run/secrets/firebase-service-account.json",
        "CORS_ALLOWED_ORIGINS": ["https://app.example.com"],
    }
    values.update(overrides)
    return Settings(**values)


def test_cors_origins_accept_comma_separated_string():
    settings = Settings(
        DATABASE_URL=_TEST_DATABASE_URL,
        CORS_ALLOWED_ORIGINS="https://app.example.com, https://admin.example.com"
    )

    assert settings.CORS_ALLOWED_ORIGINS == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


def test_production_rejects_local_database_url():
    with pytest.raises(ValidationError, match="DATABASE_URL points to localhost"):
        _production_settings(
            DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/job_tracker"
        )


def test_production_requires_firebase_credentials_path():
    with pytest.raises(ValidationError, match="FIREBASE_CREDENTIALS_JSON_PATH must be set"):
        _production_settings(FIREBASE_CREDENTIALS_JSON_PATH="")


def test_production_rejects_wildcard_cors_origin():
    with pytest.raises(ValidationError, match="CORS_ALLOWED_ORIGINS must list explicit origins"):
        _production_settings(CORS_ALLOWED_ORIGINS=["*"])


def test_ai_analysis_provider_defaults_to_deterministic():
    settings = Settings(DATABASE_URL=_TEST_DATABASE_URL)

    assert settings.AI_ANALYSIS_PROVIDER == "deterministic"
    assert settings.OLLAMA_BASE_URL == "http://localhost:11434"
    assert settings.OLLAMA_MODEL
    assert settings.OLLAMA_TIMEOUT_SECONDS == 60


def test_ollama_timeout_must_be_positive():
    with pytest.raises(ValidationError, match="OLLAMA_TIMEOUT_SECONDS must be greater than 0"):
        Settings(DATABASE_URL=_TEST_DATABASE_URL, OLLAMA_TIMEOUT_SECONDS=0)
