from __future__ import annotations

from typing import Annotated

from litestar import Router, post
from litestar.enums import RequestEncodingType
from litestar.params import Body

from app.api.schemas import UserLoginDto, UserResponseDto
from app.application.auth import AuthenticationService

router = Router("", route_handlers=(), tags=["Аутентентификация"])
service = AuthenticationService()


@router.register
@post("/login")
async def login(
    data: Annotated[UserLoginDto,
                    Body(media_type=RequestEncodingType.JSON)],
) -> UserResponseDto:
    return await service.login(data)
