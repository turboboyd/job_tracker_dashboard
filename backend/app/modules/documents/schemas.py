from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class DocumentKind(str, Enum):
    cv = "cv"
    cover_letter = "cover_letter"
    portfolio = "portfolio"
    other = "other"


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    kind: str
    original_filename: str
    content_type: str
    size_bytes: int
    sha256_hash: str
    status: str
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentRead]
    total: int
