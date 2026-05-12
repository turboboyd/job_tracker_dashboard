"""Integration tests for the Documents/files module.

Uses a real PostgreSQL database. Firebase auth and storage are mocked via
dependency_overrides — no credentials or real filesystem outside tmp_path.
"""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.session import get_db
from app.main import create_app
from app.modules.documents.storage import LocalStorageAdapter, get_storage_adapter

pytestmark = pytest.mark.asyncio(loop_scope="session")

# ── Mock helpers ────────────────────────────────────────────────────────────────


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER_A: DecodedFirebaseToken = {
    "firebase_uid": "doc-test-uid-a",
    "email": "doc-usera@example.com",
    "display_name": "Doc User A",
    "photo_url": None,
}
_USER_B: DecodedFirebaseToken = {
    "firebase_uid": "doc-test-uid-b",
    "email": "doc-userb@example.com",
    "display_name": "Doc User B",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock"}

_PDF_BYTES = b"%PDF-1.4 fake pdf content"
_TXT_BYTES = b"plain text document"


# ── App factory ─────────────────────────────────────────────────────────────────


def _make_app(
    session: AsyncSession,
    user_data: DecodedFirebaseToken,
    storage_dir: Path,
):
    app = create_app()

    async def _db():
        yield session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(user_data)
    app.dependency_overrides[get_storage_adapter] = lambda: LocalStorageAdapter(storage_dir)
    return app


# ── Fixtures ────────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def client_a(db_session, tmp_path):
    storage = tmp_path / "storage"
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_A, storage)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def client_b(db_session, tmp_path):
    storage = tmp_path / "storage"
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_B, storage)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def app_id_a(client_a):
    """Application owned by User A."""
    cycle = await client_a.post(
        "/api/v1/cycles",
        json={"title": "Documents Cycle", "target_role": "Backend Engineer"},
        headers=_BEARER,
    )
    assert cycle.status_code == 201
    r = await client_a.post(
        "/api/v1/applications",
        json={
            "company_name": "Acme",
            "role_title": "Engineer",
            "cycle_id": cycle.json()["id"],
        },
        headers=_BEARER,
    )
    assert r.status_code == 201
    return r.json()["id"]


@pytest_asyncio.fixture
async def uploaded_doc(client_a, app_id_a):
    """One uploaded PDF document owned by User A; returns the DocumentRead dict."""
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("resume.pdf", _PDF_BYTES, "application/pdf")},
        data={"kind": "cv"},
        headers=_BEARER,
    )
    assert r.status_code == 201
    return r.json()


# ── Upload ───────────────────────────────────────────────────────────────────────


async def test_upload_returns_201(client_a, app_id_a):
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("cover.pdf", _PDF_BYTES, "application/pdf")},
        data={"kind": "cover_letter"},
        headers=_BEARER,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["kind"] == "cover_letter"
    assert body["original_filename"] == "cover.pdf"
    assert body["size_bytes"] == len(_PDF_BYTES)
    assert body["status"] == "active"
    assert "id" in body
    assert "sha256_hash" in body


async def test_upload_wrong_extension_returns_422(client_a, app_id_a):
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("malware.exe", b"MZ...", "application/octet-stream")},
        headers=_BEARER,
    )
    assert r.status_code == 422


async def test_upload_too_large_returns_413(client_a, app_id_a):
    big = b"x" * (10 * 1024 * 1024 + 1)  # 1 byte over 10 MB
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("big.pdf", big, "application/pdf")},
        headers=_BEARER,
    )
    assert r.status_code == 413


async def test_upload_to_other_users_app_returns_404(client_b, app_id_a):
    r = await client_b.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("note.txt", _TXT_BYTES, "text/plain")},
        headers=_BEARER,
    )
    assert r.status_code == 404


# ── List ─────────────────────────────────────────────────────────────────────────


async def test_list_empty_initially(client_a, app_id_a):
    r = await client_a.get(
        f"/api/v1/applications/{app_id_a}/documents",
        headers=_BEARER,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0


async def test_list_after_upload(client_a, app_id_a, uploaded_doc):
    r = await client_a.get(
        f"/api/v1/applications/{app_id_a}/documents",
        headers=_BEARER,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == uploaded_doc["id"]


# ── Get metadata ─────────────────────────────────────────────────────────────────


async def test_get_metadata(client_a, uploaded_doc):
    doc_id = uploaded_doc["id"]
    r = await client_a.get(f"/api/v1/documents/{doc_id}", headers=_BEARER)
    assert r.status_code == 200
    assert r.json()["id"] == doc_id


async def test_get_metadata_not_found(client_a):
    r = await client_a.get(f"/api/v1/documents/{uuid4()}", headers=_BEARER)
    assert r.status_code == 404


async def test_kind_stored_correctly(client_a, app_id_a):
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("portfolio.zip", b"PK", "application/zip")},
        data={"kind": "portfolio"},
        headers=_BEARER,
    )
    assert r.status_code == 201
    assert r.json()["kind"] == "portfolio"


async def test_original_filename_stored(client_a, uploaded_doc):
    assert uploaded_doc["original_filename"] == "resume.pdf"


# ── Download ─────────────────────────────────────────────────────────────────────


async def test_download_returns_bytes(client_a, uploaded_doc):
    doc_id = uploaded_doc["id"]
    r = await client_a.get(f"/api/v1/documents/{doc_id}/download", headers=_BEARER)
    assert r.status_code == 200
    assert r.content == _PDF_BYTES
    assert "attachment" in r.headers.get("content-disposition", "")


# ── Delete ───────────────────────────────────────────────────────────────────────


async def test_delete_returns_204(client_a, uploaded_doc):
    doc_id = uploaded_doc["id"]
    r = await client_a.delete(f"/api/v1/documents/{doc_id}", headers=_BEARER)
    assert r.status_code == 204


async def test_delete_then_get_returns_404(client_a, app_id_a):
    # Upload
    r = await client_a.post(
        f"/api/v1/applications/{app_id_a}/documents",
        files={"file": ("tmp.pdf", _PDF_BYTES, "application/pdf")},
        headers=_BEARER,
    )
    assert r.status_code == 201
    doc_id = r.json()["id"]

    # Delete
    r = await client_a.delete(f"/api/v1/documents/{doc_id}", headers=_BEARER)
    assert r.status_code == 204

    # Get after delete
    r = await client_a.get(f"/api/v1/documents/{doc_id}", headers=_BEARER)
    assert r.status_code == 404


# ── Ownership isolation ───────────────────────────────────────────────────────────


async def test_other_user_cannot_get_document(client_a, client_b, app_id_a, uploaded_doc):
    doc_id = uploaded_doc["id"]
    r = await client_b.get(f"/api/v1/documents/{doc_id}", headers=_BEARER)
    assert r.status_code == 404
