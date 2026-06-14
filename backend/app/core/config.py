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
    DATABASE_URL: str
    # Dedicated database for integration tests. The integration test fixtures
    # call create_all/drop_all, so this MUST point at a throwaway database —
    # never the development DATABASE_URL. Left empty when not running tests.
    TEST_DATABASE_URL: str = ""

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # ── Firebase Auth ──────────────────────────────────────────────────────────
    # Absolute path to the Firebase service-account JSON file.
    # Required for production; leave empty to use mocked auth in tests.
    FIREBASE_CREDENTIALS_JSON_PATH: str = ""

    # DEV/QA ONLY. When set (e.g. "127.0.0.1:9099"), firebase-admin (wired in a
    # later stage) trusts tokens minted by the local Firebase Auth Emulator
    # instead of verifying real Google signatures. MUST be empty in production —
    # enforced by validate_production_settings below. Inert until a later stage
    # actually consumes it; declaring it here only adds validation + the prod guard.
    FIREBASE_AUTH_EMULATOR_HOST: str = ""

    # ── Document Storage ───────────────────────────────────────────────────────
    # Local filesystem root for uploaded documents (dev/test only).
    DOCUMENT_STORAGE_ROOT: str = "storage/documents"

    # AI analysis provider. Deterministic is the safe default and performs no
    # network calls. Ollama is optional and must be explicitly enabled.
    AI_ANALYSIS_PROVIDER: Literal["deterministic", "ollama"] = "deterministic"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_TIMEOUT_SECONDS: int = 60

    # Optional safe job source adapters. Keep empty to skip provider-specific
    # sources without failing discovery runs.
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    GREENHOUSE_BOARD_TOKENS: str = ""
    LEVER_SITE_NAMES: str = ""

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

    @field_validator("OLLAMA_TIMEOUT_SECONDS")
    @classmethod
    def validate_ollama_timeout(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("OLLAMA_TIMEOUT_SECONDS must be greater than 0")
        return value

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
        if "*" in self.CORS_ALLOWED_ORIGINS:
            raise ValueError(
                "CORS_ALLOWED_ORIGINS must list explicit origins in production. "
                'Remove "*" and set the deployed frontend origin instead.'
            )
        if not self.FIREBASE_CREDENTIALS_JSON_PATH:
            raise ValueError(
                "FIREBASE_CREDENTIALS_JSON_PATH must be set in production. "
                "Point it to the Firebase service-account JSON file."
            )
        if self.FIREBASE_AUTH_EMULATOR_HOST.strip():
            raise ValueError(
                "FIREBASE_AUTH_EMULATOR_HOST must be empty in production. "
                "The auth emulator is a DEV/QA-only tool and must never be "
                "reachable from a production deployment."
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
