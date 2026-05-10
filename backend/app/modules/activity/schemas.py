from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    application_id: UUID | None
    kind: str
    title: str
    description: str | None
    payload: Any
    created_at: datetime


class ActivityFeedResponse(BaseModel):
    items: list[ActivityEventRead]
