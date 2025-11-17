from __future__ import annotations

from app.application.security import SecurityService
from app.domain.dao import CalendarDao
from app.domain.schemas import CalendarResponse

security_service = SecurityService()


class CalendarService:
    def __init__(self) -> None:
        self.calendar = CalendarDao

    async def get_calendar(self) -> CalendarResponse:
        async with self.calendar() as session:
            return await session.get_calendar_for_this_month()
