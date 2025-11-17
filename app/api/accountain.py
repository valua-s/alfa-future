from __future__ import annotations

import asyncio
from typing import Annotated, Any

from litestar import Request, Router, post
from litestar.enums import RequestEncodingType
from litestar.params import Body
from litestar.response import File

from app.api.schemas import (
    ChatMessageDto,
    CheckContractResutlDto,
    FileDto,
    ResponseFromBackDto,
)
from app.application.auth import AuthenticationService
from app.domain.schemas import AgentFunctions, FullMessageData

service = AuthenticationService()

router = Router("", route_handlers=(), tags=["Бухгалтерия"])


@router.register
@post("/check-contract", summary="Проверка договора на риски")
async def get_financial_summary_by_assistaint(
    request: Request[Any, Any, Any],
    data: Annotated[FileDto,
                    Body(media_type=RequestEncodingType.MULTI_PART)],
) -> CheckContractResutlDto:
    # TODO: agent integration with accountain
    return CheckContractResutlDto(
        current=File(
            path="file_path",
                filename="file_dto.name",
                content_disposition_type="attachment"
            ),
        safe_version=File(
                path="file_path",
                filename="file_dto.name",
                content_disposition_type="attachment",
        )
    )


@router.register
@post("/question", summary="Чат с консультантом по бухгалтерии")
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
