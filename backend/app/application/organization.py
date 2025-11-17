from __future__ import annotations

from app.application.auth import AuthenticationService
from app.application.exceptions import UserWithoutOrg
from app.domain.dao import OrganizationDao
from app.domain.schemas import OrganizationDto
from app.infra.ioc import create_organization_wrapper

service = AuthenticationService()


class OrganizationService:
    def __init__(self) -> None:
        self.organization_service = OrganizationDao
        self.organization_wrapper = create_organization_wrapper

    async def add_organization_to_user(self, token: str, organization_tax_id: str) -> None:
        user_data = service.verify_token(token)
        async with self.organization_service() as session:
            organization = await session.get_organization(organization_tax_id)
            if not organization:
                async with self.organization_wrapper() as wr_session:
                    organization_data = await wr_session.get_user_organization_data(str(organization_tax_id))
                organization = await session.create_organization(organization_data)
            await session.add_organization_to_user(user_data.id, organization.id)

    async def get_user_organization(self, token: str) -> OrganizationDto:
        user_data = service.verify_token(token)
        async with self.organization_service() as session:
            organization = await session.get_organization_by_user_id(user_data.id)
            if not organization:
                raise UserWithoutOrg
            return organization
