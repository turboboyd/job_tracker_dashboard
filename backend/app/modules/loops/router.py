from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.loops.schemas import LoopCreate, LoopListResponse, LoopRead, LoopUpdate
from app.modules.loops.service import LoopsService

router = APIRouter(prefix="/loops", tags=["loops"])


def get_loops_service(db: DbSession) -> LoopsService:
    return LoopsService(db)


LoopsSvc = Annotated[LoopsService, Depends(get_loops_service)]


@router.get("", response_model=LoopListResponse, summary="List loops")
async def list_loops(
    current_user: CurrentUser,
    svc: LoopsSvc,
    include_archived: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> LoopListResponse:
    items, total = await svc.list_for_user(
        current_user,
        include_archived=include_archived,
        limit=limit,
        offset=offset,
    )
    return LoopListResponse(
        items=[LoopRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=LoopRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create loop",
)
async def create_loop(
    payload: LoopCreate,
    current_user: CurrentUser,
    svc: LoopsSvc,
) -> LoopRead:
    loop = await svc.create(current_user, payload)
    return LoopRead.model_validate(loop)


@router.get("/{loop_id}", response_model=LoopRead, summary="Get loop")
async def get_loop(
    loop_id: UUID,
    current_user: CurrentUser,
    svc: LoopsSvc,
) -> LoopRead:
    loop = await svc.get_owned(current_user, loop_id)
    return LoopRead.model_validate(loop)


@router.patch("/{loop_id}", response_model=LoopRead, summary="Update loop")
async def patch_loop(
    loop_id: UUID,
    payload: LoopUpdate,
    current_user: CurrentUser,
    svc: LoopsSvc,
) -> LoopRead:
    loop = await svc.patch(current_user, loop_id, payload)
    return LoopRead.model_validate(loop)


@router.delete("/{loop_id}", response_model=LoopRead, summary="Archive loop")
async def delete_loop(
    loop_id: UUID,
    current_user: CurrentUser,
    svc: LoopsSvc,
) -> LoopRead:
    loop = await svc.archive(current_user, loop_id)
    return LoopRead.model_validate(loop)
