import re
import uuid

from starlette.types import ASGIApp, Receive, Scope, Send

# Allow alphanumeric, hyphens, underscores — covers UUIDs and common trace-id formats.
_SAFE_ID = re.compile(r"^[A-Za-z0-9\-_]{1,64}$")


class RequestIDMiddleware:
    """Attach a request_id to every request/response pair.

    Pure-ASGI implementation (no BaseHTTPMiddleware) so exceptions from route
    handlers never leak through the middleware boundary.

    Accepts X-Request-ID from the caller if it matches the safe-character
    pattern (alphanumeric / hyphens / underscores, 1–64 chars); otherwise
    generates a fresh UUID4.  The resolved ID is stored on
    request.state.request_id (readable by exception handlers and route code)
    and echoed in the X-Request-ID response header on every response.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Resolve or generate request ID from incoming header.
        raw_headers: dict[bytes, bytes] = dict(scope.get("headers", []))
        incoming = raw_headers.get(b"x-request-id", b"").decode("latin-1")
        request_id = incoming if (incoming and _SAFE_ID.match(incoming)) else str(uuid.uuid4())

        # Store directly on scope under a private key — avoids State vs dict
        # compatibility differences across Starlette versions.
        scope["_x_request_id"] = request_id

        # Wrap send to inject the X-Request-ID header before streaming begins.
        async def send_with_rid(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_rid)
