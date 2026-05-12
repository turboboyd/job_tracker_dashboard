import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Domain-level error with a stable machine-readable code."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _rid(request: Request) -> str:
    """Return the request_id set by RequestIDMiddleware, or 'unknown' as fallback."""
    return request.scope.get("_x_request_id", "unknown")


def _error_body(code: str, message: str, request_id: str) -> dict:
    return {"error": {"code": code, "message": message, "request_id": request_id}}


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.code, exc.message, _rid(request)),
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(str(exc.status_code), exc.detail or "HTTP error", _rid(request)),
    )


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    for err in exc.errors():
        if (
            request.method == "POST"
            and request.url.path.endswith("/api/v1/applications")
            and tuple(err.get("loc", ())) == ("body", "cycle_id")
            and err.get("type") in {"missing", "uuid_type"}
        ):
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content=_error_body(
                    "CYCLE_REQUIRED",
                    "Create or select an active search cycle before creating an application.",
                    _rid(request),
                ),
            )

    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []))
    msg = first.get("msg", "Validation error")
    detail = f"{field}: {msg}" if field else msg
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_body("VALIDATION_ERROR", detail, _rid(request)),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _rid(request)
    logger.exception(
        "Unhandled exception on %s %s (request_id=%s)",
        request.method,
        request.url.path,
        request_id,
    )
    # Set header directly: ServerErrorMiddleware (outermost) sends this response
    # via its own transport send, bypassing the send_with_rid wrapper.
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_error_body("INTERNAL_ERROR", "An unexpected error occurred", request_id),
        headers={"X-Request-ID": request_id},
    )
