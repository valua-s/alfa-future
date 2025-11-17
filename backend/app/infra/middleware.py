from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.auth import AuthenticationService

if TYPE_CHECKING:
    from collections.abc import Callable

    from litestar.types import ASGIApp, Receive, Scope, Send

service = AuthenticationService()


def resource_middleware_factory() -> Callable[[ASGIApp], ASGIApp]:
    def middleware_factory(app: ASGIApp) -> ASGIApp:
        async def my_middleware(scope: Scope, receive: Receive, send: Send) -> None:

            headers_list = scope.get("headers", [])
            headers = {
                key.decode("utf-8").lower(): value.decode("utf-8") for key, value in headers_list
            }
            access_token = headers.get("authentication", "").replace("Bearer ", "").replace("bearer ", "")
            service.verify_token(access_token)
            await app(scope, receive, send)

        return my_middleware
    return middleware_factory


chat_middleware = resource_middleware_factory()
