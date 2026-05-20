from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

LoopStatus = Literal["active", "paused", "archived"]

MAX_KEYWORDS = 30
MAX_EXCLUDED_KEYWORDS = 30
MAX_EMPLOYMENT_TYPES = 10
MAX_WORK_MODES = 10
MAX_SELECTED_SOURCES = 20


def normalize_string_list(value: list[str], *, max_items: int, field_name: str) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []

    for item in value:
        trimmed = item.strip()
        if not trimmed:
            continue
        key = trimmed.casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(trimmed)

    if len(normalized) > max_items:
        raise ValueError(f"{field_name} must contain at most {max_items} items")
    return normalized


class LoopSearchSettingsMixin(BaseModel):
    keywords: list[str] = Field(default_factory=list)
    excluded_keywords: list[str] = Field(default_factory=list)
    employment_types: list[str] = Field(default_factory=list)
    work_modes: list[str] = Field(default_factory=list)
    selected_sources: list[str] = Field(default_factory=list)
    auto_discovery_enabled: bool = False
    discovery_radius_km: int | None = Field(default=None, ge=0, le=250)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str]) -> list[str]:
        return normalize_string_list(
            value,
            max_items=MAX_KEYWORDS,
            field_name="keywords",
        )

    @field_validator("excluded_keywords")
    @classmethod
    def normalize_excluded_keywords(cls, value: list[str]) -> list[str]:
        return normalize_string_list(
            value,
            max_items=MAX_EXCLUDED_KEYWORDS,
            field_name="excluded_keywords",
        )

    @field_validator("employment_types")
    @classmethod
    def normalize_employment_types(cls, value: list[str]) -> list[str]:
        return normalize_string_list(
            value,
            max_items=MAX_EMPLOYMENT_TYPES,
            field_name="employment_types",
        )

    @field_validator("work_modes")
    @classmethod
    def normalize_work_modes(cls, value: list[str]) -> list[str]:
        return normalize_string_list(
            value,
            max_items=MAX_WORK_MODES,
            field_name="work_modes",
        )

    @field_validator("selected_sources")
    @classmethod
    def normalize_selected_sources(cls, value: list[str]) -> list[str]:
        return normalize_string_list(
            value,
            max_items=MAX_SELECTED_SOURCES,
            field_name="selected_sources",
        )


class LoopCreate(LoopSearchSettingsMixin):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=255)
    target_role: str | None = None
    location: str | None = None
    radius_km: int | None = Field(default=None, ge=0, le=500)
    sources: list[str] = Field(default_factory=list)
    status: LoopStatus = "active"

    @field_validator("sources")
    @classmethod
    def normalize_sources(cls, value: list[str]) -> list[str]:
        return normalize_string_list(value, max_items=20, field_name="sources")


class LoopUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    target_role: str | None = None
    location: str | None = None
    radius_km: int | None = Field(default=None, ge=0, le=500)
    sources: list[str] | None = None
    status: LoopStatus | None = None
    keywords: list[str] | None = None
    excluded_keywords: list[str] | None = None
    employment_types: list[str] | None = None
    work_modes: list[str] | None = None
    selected_sources: list[str] | None = None
    auto_discovery_enabled: bool | None = None
    discovery_radius_km: int | None = Field(default=None, ge=0, le=250)

    @field_validator("sources")
    @classmethod
    def normalize_sources(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(value, max_items=20, field_name="sources")

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(value, max_items=MAX_KEYWORDS, field_name="keywords")

    @field_validator("excluded_keywords")
    @classmethod
    def normalize_excluded_keywords(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(
            value,
            max_items=MAX_EXCLUDED_KEYWORDS,
            field_name="excluded_keywords",
        )

    @field_validator("employment_types")
    @classmethod
    def normalize_employment_types(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(
            value,
            max_items=MAX_EMPLOYMENT_TYPES,
            field_name="employment_types",
        )

    @field_validator("work_modes")
    @classmethod
    def normalize_work_modes(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(value, max_items=MAX_WORK_MODES, field_name="work_modes")

    @field_validator("selected_sources")
    @classmethod
    def normalize_selected_sources(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return normalize_string_list(
            value,
            max_items=MAX_SELECTED_SOURCES,
            field_name="selected_sources",
        )


class LoopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    target_role: str | None
    location: str | None
    radius_km: int | None
    sources: list[str]
    status: str
    keywords: list[str]
    excluded_keywords: list[str]
    employment_types: list[str]
    work_modes: list[str]
    selected_sources: list[str]
    auto_discovery_enabled: bool
    discovery_radius_km: int | None
    last_discovery_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LoopListResponse(BaseModel):
    items: list[LoopRead]
    total: int
    limit: int
    offset: int
