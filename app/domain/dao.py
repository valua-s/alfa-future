from __future__ import annotations

from datetime import datetime

from sqlalchemy import extract, select
from sqlalchemy.orm import joinedload

from app.domain.models import Organization, TaxDeadline, User
from app.domain.schemas import (
    CalendarResponse,
    DCreateOrganizationDto,
    DeadlineResponse,
    OrganizationDto,
    UserDataResponseDto,
    month_names,
)
from app.infra.db.repo.uow import UnitOfWork


class UserDao(UnitOfWork):
    def __init__(self) -> None:
        super().__init__()

    async def get_user_by_username(self, username: str) -> UserDataResponseDto | None:
        async with self as session:
            user = await session.scalar(select(User).where(User.username == username))
            return UserDataResponseDto.model_validate(user) if user else None


class OrganizationDao(UnitOfWork):
    def __init__(self) -> None:
        super().__init__()

    async def get_organization_by_user_id(self, user_id: int) -> OrganizationDto | None:
        async with self as session:
            user = await session.scalar(select(User).where(User.id == user_id).options(joinedload(User.organization)))
            if user and user.organization_id:
                return OrganizationDto.model_validate(user.organization) if user.organization else None
            return None

    async def add_organization_to_user(self, user_id: int, organization_id: int) -> None:
        async with self as session:
            user = await session.get(User, user_id)
            if user:
                user.organization_id = organization_id
            await session.flush()

    async def get_organization(self, tax_id: str) -> OrganizationDto | None:
        async with self as session:
            exist = await session.scalar(select(Organization).where(Organization.tax_id == tax_id))
            return OrganizationDto.model_validate(exist) if exist else None

    async def create_organization(self, create_data: DCreateOrganizationDto) -> OrganizationDto:
        async with self as session:
            organization = Organization(**create_data.model_dump())
            session.add(organization)
            await session.flush()
            await session.refresh(organization)
            return OrganizationDto.model_validate(organization)


class CalendarDao(UnitOfWork):
    def __init__(self) -> None:
        super().__init__()

    async def get_calendar_for_this_month(self) -> CalendarResponse:
        async with self as session:
            today = datetime.now()
            current_year = today.year
            current_month = today.month
            calendar = (await session.scalars(
                select(TaxDeadline).filter(
                    extract("year", TaxDeadline.deadline_date) == current_year,
                    extract("month", TaxDeadline.deadline_date) == current_month
            )   .order_by(TaxDeadline.deadline_date))).all()

            deadlines_response: list[DeadlineResponse] = [
                (DeadlineResponse(
                    date=deadline.deadline_date,
                    title=deadline.title,
                    type=deadline.report_type,
                    importance=deadline.importance,
                    days_left=(deadline.deadline_date - today.date()).days
                )) for deadline in calendar]
            return CalendarResponse(
                current_month=f"{month_names[current_month]} {current_year}",
                deadlines=deadlines_response
            )
