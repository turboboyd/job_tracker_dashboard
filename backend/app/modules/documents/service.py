from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.db.models.document import Document
from app.db.models.user import User
from app.db.session import DbSession
from app.modules.applications.service import ApplicationsService
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import DocumentKind
from app.modules.documents.storage import LocalStorageAdapter

_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".zip"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class DocumentsService:
    def __init__(self, db: DbSession, storage: LocalStorageAdapter) -> None:
        self._db = db
        self._storage = storage
        self._repo = DocumentRepository(db)

    async def upload(
        self,
        current_user: User,
        application_id: uuid.UUID,
        file: UploadFile,
        kind: DocumentKind,
    ) -> Document:
        app_svc = ApplicationsService(self._db)
        app = await app_svc.get_owned(current_user, application_id)
        if app is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        original_filename = file.filename or "upload"
        ext = Path(original_filename).suffix.lower()
        if ext not in _ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=422,
                detail=f"File type '{ext}' not allowed. Allowed: {sorted(_ALLOWED_EXTENSIONS)}",
            )

        data = await file.read()
        if len(data) > _MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds 10 MB limit ({len(data)} bytes)",
            )

        sha256 = hashlib.sha256(data).hexdigest()
        doc_id = uuid.uuid4()
        storage_key = (
            f"users/{current_user.id}/applications/{application_id}"
            f"/documents/{doc_id}/original{ext}"
        )
        content_type = file.content_type or "application/octet-stream"

        await self._storage.save(storage_key, data)

        doc = Document(
            id=doc_id,
            user_id=current_user.id,
            application_id=application_id,
            kind=kind.value,
            original_filename=original_filename,
            content_type=content_type,
            size_bytes=len(data),
            storage_provider="local",
            storage_key=storage_key,
            sha256_hash=sha256,
            status="active",
        )
        return await self._repo.create(doc)

    async def list_for_application(
        self,
        current_user: User,
        application_id: uuid.UUID,
    ) -> list[Document]:
        app_svc = ApplicationsService(self._db)
        app = await app_svc.get_owned(current_user, application_id)
        if app is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )
        return await self._repo.list_for_application(application_id)

    async def get_owned(
        self,
        current_user: User,
        doc_id: uuid.UUID,
    ) -> Document | None:
        doc = await self._repo.get_by_id(doc_id)
        if doc is None or doc.user_id != current_user.id:
            return None
        return doc

    async def download(
        self,
        current_user: User,
        doc_id: uuid.UUID,
    ) -> tuple[bytes, str, str]:
        """Returns (data, content_type, original_filename)."""
        doc = await self.get_owned(current_user, doc_id)
        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        try:
            data = await self._storage.load(doc.storage_key)
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage",
            )
        return data, doc.content_type, doc.original_filename

    async def delete(
        self,
        current_user: User,
        doc_id: uuid.UUID,
    ) -> None:
        doc = await self.get_owned(current_user, doc_id)
        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        await self._storage.delete(doc.storage_key)
        await self._repo.delete(doc)
