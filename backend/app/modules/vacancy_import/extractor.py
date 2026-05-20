from __future__ import annotations

import html
import json
import re
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlparse

from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse

_MAX_DESCRIPTION_CHARS = 4000
_MAX_VISIBLE_TEXT_CHARS = 2000


class _VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style", "noscript"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript"} and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0:
            return
        text = normalize_space(data)
        if text:
            self.parts.append(text)


def normalize_space(value: str | None) -> str | None:
    if value is None:
        return None
    text = html.unescape(value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def strip_html(value: str | None) -> str | None:
    if value is None:
        return None
    parser = _VisibleTextParser()
    parser.feed(value)
    return truncate_text(" ".join(parser.parts), _MAX_DESCRIPTION_CHARS)


def truncate_text(value: str | None, max_chars: int) -> str | None:
    text = normalize_space(value)
    if text is None:
        return None
    return text if len(text) <= max_chars else f"{text[: max_chars - 1].rstrip()}…"


def _read_path(value: Any, path: tuple[str, ...]) -> Any:
    current = value
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _string_value(value: Any) -> str | None:
    if isinstance(value, str):
        return normalize_space(value)
    if isinstance(value, dict):
        name = value.get("name") or value.get("text")
        if isinstance(name, str):
            return normalize_space(name)
    if isinstance(value, list):
        strings = [_string_value(item) for item in value]
        return normalize_space(", ".join(item for item in strings if item))
    return None


def _jobposting_type_matches(value: Any) -> bool:
    if isinstance(value, str):
        return value.lower() == "jobposting"
    if isinstance(value, list):
        return any(_jobposting_type_matches(item) for item in value)
    return False


def _iter_jsonld_nodes(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        nodes: list[dict[str, Any]] = []
        for item in value:
            nodes.extend(_iter_jsonld_nodes(item))
        return nodes
    if not isinstance(value, dict):
        return []

    nodes = [value]
    graph = value.get("@graph")
    if isinstance(graph, list):
        nodes.extend(_iter_jsonld_nodes(graph))
    return nodes


def _extract_jsonld_scripts(markup: str) -> list[str]:
    pattern = re.compile(
        r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        re.IGNORECASE | re.DOTALL,
    )
    return [html.unescape(match.group(1).strip()) for match in pattern.finditer(markup)]


def _first_jobposting(markup: str) -> dict[str, Any] | None:
    for raw_json in _extract_jsonld_scripts(markup):
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError:
            continue
        for node in _iter_jsonld_nodes(parsed):
            if _jobposting_type_matches(node.get("@type")):
                return node
    return None


def _location_from_jobposting(job: dict[str, Any]) -> str | None:
    location = job.get("jobLocation") or job.get("applicantLocationRequirements")
    if isinstance(location, list):
        values = [_location_from_jobposting({"jobLocation": item}) for item in location]
        return normalize_space(", ".join(item for item in values if item))
    if isinstance(location, dict):
        address = location.get("address")
        if isinstance(address, dict):
            pieces = [
                _string_value(address.get("addressLocality")),
                _string_value(address.get("addressRegion")),
                _string_value(address.get("addressCountry")),
            ]
            return normalize_space(", ".join(piece for piece in pieces if piece))
        return _string_value(address) or _string_value(location.get("name"))
    return _string_value(location)


def _meta_content(markup: str, names: tuple[str, ...]) -> str | None:
    for name in names:
        escaped = re.escape(name)
        patterns = (
            rf"<meta[^>]+(?:property|name)=[\"']{escaped}[\"'][^>]+content=[\"']([^\"']*)[\"'][^>]*>",
            rf"<meta[^>]+content=[\"']([^\"']*)[\"'][^>]+(?:property|name)=[\"']{escaped}[\"'][^>]*>",
        )
        for pattern in patterns:
            match = re.search(pattern, markup, re.IGNORECASE | re.DOTALL)
            if match:
                return truncate_text(match.group(1), _MAX_DESCRIPTION_CHARS)
    return None


def _title(markup: str) -> str | None:
    match = re.search(r"<title[^>]*>(.*?)</title>", markup, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    return truncate_text(match.group(1), 300)


def _visible_text(markup: str) -> str | None:
    parser = _VisibleTextParser()
    parser.feed(markup)
    return truncate_text(" ".join(parser.parts), _MAX_VISIBLE_TEXT_CHARS)


def _source_from_url(url: str) -> str:
    host = urlparse(url).hostname or "unknown"
    return host.removeprefix("www.")


def extract_vacancy_preview(source_url: str, markup: str) -> VacancyImportPreviewResponse:
    warnings: list[str] = []
    confidence: dict[str, float] = {}
    source = _source_from_url(source_url)

    company_name: str | None = None
    role_title: str | None = None
    location_text: str | None = None
    vacancy_description: str | None = None

    job = _first_jobposting(markup)
    if job is not None:
        role_title = _string_value(job.get("title"))
        company_name = _string_value(_read_path(job, ("hiringOrganization", "name")))
        location_text = _location_from_jobposting(job)
        vacancy_description = strip_html(_string_value(job.get("description")))
        confidence.update(
            {
                "role_title": 0.95 if role_title else 0.0,
                "company_name": 0.9 if company_name else 0.0,
                "location_text": 0.85 if location_text else 0.0,
                "vacancy_description": 0.9 if vacancy_description else 0.0,
            },
        )
    else:
        warnings.append("No JSON-LD JobPosting block found; used meta/title fallback.")

    if role_title is None:
        role_title = _meta_content(markup, ("og:title", "twitter:title")) or _title(markup)
        confidence["role_title"] = 0.55 if role_title else 0.0

    if vacancy_description is None:
        vacancy_description = _meta_content(
            markup,
            ("og:description", "description", "twitter:description"),
        ) or _visible_text(markup)
        confidence["vacancy_description"] = 0.45 if vacancy_description else 0.0

    if company_name is None:
        company_name = _meta_content(markup, ("og:site_name", "application-name"))
        confidence["company_name"] = 0.45 if company_name else 0.0

    confidence.setdefault("location_text", 0.0)
    confidence.setdefault("role_title", 0.0)
    confidence.setdefault("company_name", 0.0)
    confidence.setdefault("vacancy_description", 0.0)

    if role_title is None:
        warnings.append("Could not detect role title automatically.")
    if company_name is None:
        warnings.append("Could not detect company name automatically.")

    return VacancyImportPreviewResponse(
        source_url=source_url,
        source=source,
        company_name=company_name,
        role_title=role_title,
        location_text=location_text,
        vacancy_description=vacancy_description,
        confidence=confidence,
        warnings=warnings,
    )
