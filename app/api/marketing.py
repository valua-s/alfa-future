from __future__ import annotations

import asyncio
from typing import Annotated, Any

from litestar import Request, Router, get, post
from litestar.enums import RequestEncodingType
from litestar.params import Body
from litestar.response import File

from app.api.schemas import (
    ChatMessageDto,
    PeriodDatesRequest,
    ResponseFromBackDto,
)
from app.application.auth import AuthenticationService
from app.domain.mock_balanses import FinancialSummary, financial_summary
from app.domain.schemas import (
    AgentFunctions,
    DownturnsResponse,
    FinancialSummaryResponse,
    FullMessageData,
    KeyMetricsResponse,
)

service = AuthenticationService()

router = Router("", route_handlers=(), tags=["Маркетинг"])
service = AuthenticationService()


@router.register
@get("/financial-summary-bank", summary="Остатки, выручка, расходы")
async def get_financial_summary(
    request: Request[Any, Any, Any],
) -> FinancialSummary:
    return financial_summary


@router.register
@post("/financial-summary", summary="Финансовые итоги за период")
async def get_financial_summary_by_assistaint(
    request: Request[Any, Any, Any],
    data: Annotated[PeriodDatesRequest,
                    Body(media_type=RequestEncodingType.JSON)],
) -> FinancialSummaryResponse:
    # TODO: agent integration with financial summary
   pass


@router.register
@post("/financial-summary/generate-pdf", summary="Финансовые итоги за период в PDF")
async def get_troubles_by_agent(
    request: Request[Any, Any, Any],
    data: Annotated[PeriodDatesRequest,
                    Body(media_type=RequestEncodingType.JSON)],
) -> File:
    # TODO: agent integration with financial summary and create pdf
    return File(
        path="file_path",
        filename="file_dto.name",
        content_disposition_type="attachment",
    )


@router.register
@get("/key-metrics", summary="Ключевые метрики")
async def get_calendar(
    request: Request[Any, Any, Any],
) -> KeyMetricsResponse:
    # TODO: agent integration with financial for key metrics
    pass


@router.register
@get("/downturns", summary="Просадки")
async def get_results(
    request: Request[Any, Any, Any],
) -> DownturnsResponse:
    # TODO: agent integration with financial for downturns
    pass


@router.register
@post("/question", summary="Чат с маркетинговым консультантом")
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
