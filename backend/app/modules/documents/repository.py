from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import Document


class DocumentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, doc: Document) -> Document:
        self._db.add(doc)
        await self._db.flush()
        await self._db.refresh(doc)
        return doc

    async def get_by_id(self, doc_id: uuid.UUID) -> Document | None:
        result = await self._db.execute(
            select(Document).where(Document.id == doc_id)
        )
        return result.scalar_one_or_none()

    async def list_for_application(self, application_id: uuid.UUID) -> list[Document]:
        result = await self._db.execute(
            select(Document)
            .where(Document.application_id == application_id)
            .order_by(Document.created_at.asc())
        )
        return list(result.scalars().all())

    async def delete(self, doc: Document) -> None:
        await self._db.delete(doc)
        await self._db.flush()
