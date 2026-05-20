from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from app.db.models.loop import Loop
from app.modules.discovery_adapters.safety import ALLOWED_URL_SCHEMES

SENIORITY_WORDS = {
    "senior",
    "sr",
    "junior",
    "jr",
    "middle",
    "mid",
    "lead",
    "principal",
    "staff",
}


def clean_string(value: Any, *, max_length: int | None = None) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        value = str(value)
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split())
    if not cleaned:
        return None
    return cleaned[:max_length] if max_length else cleaned


def is_allowed_url(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme in ALLOWED_URL_SCHEMES and bool(parsed.netloc)


def compact_terms(values: list[Any], *, limit: int = 4, max_length: int = 120) -> list[str]:
    seen: set[str] = set()
    terms: list[str] = []
    for value in values:
        term = clean_string(value)
        if not term:
            continue
        key = term.casefold()
        if key in seen:
            continue
        seen.add(key)
        terms.append(term)
        if len(terms) >= limit:
            break
    joined = " ".join(terms)[:max_length]
    return joined.split() if joined else []


def search_text_from_loop(loop: Loop, *, max_length: int = 120) -> str | None:
    terms = compact_terms(
        [
            getattr(loop, "target_role", None),
            *(getattr(loop, "keywords", None) or []),
        ],
        limit=5,
        max_length=max_length,
    )
    return clean_string(" ".join(terms), max_length=max_length)


def broad_role_text_from_loop(loop: Loop, *, max_length: int = 80) -> str | None:
    role = clean_string(getattr(loop, "target_role", None), max_length=max_length)
    if not role:
        return None
    words = [
        word
        for word in role.split()
        if word.casefold().strip(".") not in SENIORITY_WORDS
    ]
    return clean_string(" ".join(words) or role, max_length=max_length)


def location_from_loop(loop: Loop, *, max_length: int = 80) -> str | None:
    return clean_string(getattr(loop, "location", None), max_length=max_length)


def csv_values(value: str | None) -> list[str]:
    if not value:
        return []
    seen: set[str] = set()
    result: list[str] = []
    for item in value.split(","):
        cleaned = clean_string(item)
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result
