from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import Response

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.documents.schemas import DocumentKind, DocumentListResponse, DocumentRead
from app.modules.documents.service import DocumentsService
from app.modules.documents.storage import LocalStorageAdapter, get_storage_adapter

router = APIRouter(tags=["documents"])


def _svc(
    db: DbSession,
    storage: LocalStorageAdapter = Depends(get_storage_adapter),
) -> DocumentsService:
    return DocumentsService(db, storage)


@router.post(
    "/applications/{app_id}/documents",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
)
async def upload_document(
    app_id: UUID,
    current_user: CurrentUser,
    file: UploadFile,
    kind: DocumentKind = Form(default=DocumentKind.other),
    svc: DocumentsService = Depends(_svc),
) -> DocumentRead:
    doc = await svc.upload(current_user, app_id, file, kind)
    return DocumentRead.model_validate(doc)


@router.get(
    "/applications/{app_id}/documents",
    response_model=DocumentListResponse,
    summary="List documents for an application",
)
async def list_documents(
    app_id: UUID,
    current_user: CurrentUser,
    svc: DocumentsService = Depends(_svc),
) -> DocumentListResponse:
    docs = await svc.list_for_application(current_user, app_id)
    return DocumentListResponse(
        items=[DocumentRead.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.get(
    "/documents/{document_id}",
    response_model=DocumentRead,
    summary="Get document metadata",
)
async def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    svc: DocumentsService = Depends(_svc),
) -> DocumentRead:
    doc = await svc.get_owned(current_user, document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentRead.model_validate(doc)


@router.get(
    "/documents/{document_id}/download",
    summary="Download a document",
    response_class=Response,
)
async def download_document(
    document_id: UUID,
    current_user: CurrentUser,
    svc: DocumentsService = Depends(_svc),
) -> Response:
    data, content_type, filename = await svc.download(current_user, document_id)
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete(
    "/documents/{document_id}",
    summary="Delete a document",
)
async def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    svc: DocumentsService = Depends(_svc),
) -> Response:
    await svc.delete(current_user, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
