from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

MAX_VACANCY_IMPORT_URL_LENGTH = 2048
_BLOCKED_HOSTS = {"localhost", "localhost.localdomain"}


class VacancyImportValidationError(ValueError):
    pass


def _is_blocked_ip(address: ipaddress._BaseAddress) -> bool:  # type: ignore[attr-defined]
    return any(
        (
            address.is_private,
            address.is_loopback,
            address.is_link_local,
            address.is_multicast,
            address.is_reserved,
            address.is_unspecified,
        ),
    )


def _parse_ip(hostname: str) -> ipaddress._BaseAddress | None:  # type: ignore[attr-defined]
    try:
        return ipaddress.ip_address(hostname.strip("[]"))
    except ValueError:
        return None


def _validate_resolved_addresses(hostname: str) -> None:
    try:
        addresses = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise VacancyImportValidationError("Could not resolve vacancy URL host") from exc

    for result in addresses:
        sockaddr = result[4]
        if not sockaddr:
            continue
        address = _parse_ip(str(sockaddr[0]))
        if address and _is_blocked_ip(address):
            raise VacancyImportValidationError(
                "Vacancy URL resolves to a private or internal address",
            )


def validate_vacancy_import_url(url: str, *, resolve_host: bool = True) -> str:
    normalized = url.strip()
    if len(normalized) > MAX_VACANCY_IMPORT_URL_LENGTH:
        raise VacancyImportValidationError("Vacancy URL is too long")

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"}:
        raise VacancyImportValidationError("Vacancy URL must use http or https")

    hostname = parsed.hostname
    if not hostname:
        raise VacancyImportValidationError("Vacancy URL must include a host")

    normalized_host = hostname.lower().strip("[]")
    if normalized_host in _BLOCKED_HOSTS or normalized_host.endswith(".localhost"):
        raise VacancyImportValidationError("Localhost URLs are not allowed")

    direct_ip = _parse_ip(normalized_host)
    if direct_ip and _is_blocked_ip(direct_ip):
        raise VacancyImportValidationError("Private or internal IP URLs are not allowed")

    if resolve_host and direct_ip is None:
        _validate_resolved_addresses(normalized_host)

    return normalized
