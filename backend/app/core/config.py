import re
from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_LOCALHOST_PATTERN = re.compile(r"@(localhost|127\.0\.0\.1)(:\d+)?/")


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────────
    APP_NAME: str = "job-tracker-api"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "production"] = "development"
    LOG_LEVEL: str = "INFO"

    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/job_tracker"

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # ── Firebase Auth ──────────────────────────────────────────────────────────
    # Absolute path to the Firebase service-account JSON file.
    # Required for production; leave empty to use mocked auth in tests.
    FIREBASE_CREDENTIALS_JSON_PATH: str = ""

    # ── Document Storage ───────────────────────────────────────────────────────
    # Local filesystem root for uploaded documents (dev/test only).
    DOCUMENT_STORAGE_ROOT: str = "storage/documents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def normalise_log_level(cls, v: str) -> str:
        return v.upper()

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Refuse to start in production with unsafe defaults."""
        if self.ENVIRONMENT != "production":
            return self
        if _LOCALHOST_PATTERN.search(self.DATABASE_URL):
            raise ValueError(
                "DATABASE_URL points to localhost — this must be overridden in production. "
                "Set DATABASE_URL to a non-local PostgreSQL connection string."
            )
        if not self.FIREBASE_CREDENTIALS_JSON_PATH:
            raise ValueError(
                "FIREBASE_CREDENTIALS_JSON_PATH must be set in production. "
                "Point it to the Firebase service-account JSON file."
            )
        return self

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
