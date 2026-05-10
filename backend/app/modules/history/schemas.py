from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HistoryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    application_id: UUID
    user_id: UUID
    actor: str
    type: str
    from_status: str | None
    to_status: str | None
    field_path: str | None
    old_value: Any
    new_value: Any
    comment: str | None
    feedback_type: str | None
    sentiment: str | None
    rejection_reason_code: str | None
    correlation_id: str | None
    created_at: datetime


class HistoryListResponse(BaseModel):
    items: list[HistoryItemRead]


class CommentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str
    feedback_type: str | None = None
    sentiment: str | None = None
    rejection_reason_code: str | None = None
    correlation_id: str | None = None
