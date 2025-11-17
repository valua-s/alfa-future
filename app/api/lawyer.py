from __future__ import annotations

import asyncio
from typing import Annotated, Any

from litestar import Request, Router, post
from litestar.enums import RequestEncodingType
from litestar.params import Body

from app.api.schemas import ChatMessageDto, ResponseFromBackDto
from app.application.auth import AuthenticationService
from app.domain.schemas import AgentFunctions, FullMessageData

service = AuthenticationService()
router = Router("", route_handlers=(), tags=["Юрист"])


@router.register
@post("/question", summary="Чат с юридическим консультантом")
async def post_message(
    request: Request[Any, Any, Any],
    data: Annotated[ChatMessageDto,
                    Body(media_type=RequestEncodingType.MULTI_PART)],
) -> ResponseFromBackDto:
    user_data = service.verify_token(request.headers.get("authentication"))
    files_bytes = None
    if data.files:
        tasks = [upload_file.read() for upload_file in data.files]
        files_bytes = await asyncio.gather(*tasks)
    data_full = FullMessageData(
        question_text=data.text_message or "",
        from_user_id=user_data.id,
        from_service=AgentFunctions.FINANCE,
        files=files_bytes
    )
    # TODO: agent integration with financial for chat
