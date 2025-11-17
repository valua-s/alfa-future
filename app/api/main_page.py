from __future__ import annotations

from typing import Any

from litestar import Request, Router, get

from app.api.schemas import ResultsOut, TroublesOut
from app.application.calendar import CalendarService
from app.domain.mock_balanses import (
    MockAccountBalance,
    MockBalance,
    main_account_mock,
    other_accounts_mock,
)
from app.domain.schemas import CalendarResponse

router = Router("", route_handlers=(), tags=["Главная"])
service = CalendarService()


@router.register
@get("/main-account", summary="Данные об основном счете")
async def get_main_account_mock(
    request: Request[Any, Any, Any],
) -> MockBalance:
    return main_account_mock


@router.register
@get("/other-account", summary="Данные об дополнительном счете")
async def get_other_account_mock(
    request: Request[Any, Any, Any],
) -> MockAccountBalance:
    return other_accounts_mock


@router.register
@get("/troubles", summary="Проблемы найденные агентом")
async def get_troubles_by_agent(
    request: Request[Any, Any, Any],
) -> TroublesOut:
    # TODO: agent integration with troubles
    pass


@router.register
@get("/calendar", summary="Календарь событий")
async def get_calendar(
    request: Request[Any, Any, Any],
) -> CalendarResponse:
    return await service.get_calendar()


@router.register
@get("/results", summary="Результаты собранные агентом")
async def get_results(
    request: Request[Any, Any, Any],
) -> ResultsOut:
    # TODO: agent integration with results
    pass
