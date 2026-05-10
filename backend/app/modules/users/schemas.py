from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    """Public representation of a local user (returned by GET/PATCH /users/me)."""

    id: UUID
    firebase_uid: str
    email: str | None
    display_name: str | None
    photo_url: str | None
    language: str
    timezone: str
    date_format: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPatch(BaseModel):
    """Fields the user is allowed to update themselves.

    - display_name: locally overrideable; None = skip (do not clear)
    - language / timezone / date_format: preference fields; None = skip
    - firebase_uid / email / id / created_at: immutable, not exposed here
    """

    display_name: str | None = None
    language: str | None = None
    timezone: str | None = None
    date_format: str | None = None

    model_config = ConfigDict(extra="forbid")
