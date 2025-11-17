from __future__ import annotations

from typing import TYPE_CHECKING

from aiohttp import hdrs
from pydantic import BaseModel

from app.domain.schemas import DCreateOrganizationDto
from app.infra.api_wrappers.base import BaseWrapper
from app.infra.config import config

if TYPE_CHECKING:

    from aiohttp import ClientSession
    from pydantic import HttpUrl


class LineAdressDto(BaseModel):
    line_address: str


class ShortNameDto(BaseModel):
    short_name: str


class OrganizationDataDto(BaseModel):
    company_names: ShortNameDto
    adress: LineAdressDto | None = None


class InputOrganizationDto(BaseModel):
    inn: str
    company: OrganizationDataDto

    @property
    def tax_id(self) -> str:
        return self.inn

    @property
    def legal_name(self) -> str:
        return self.company.company_names.short_name

    @property
    def address(self) -> str:
        return self.company.adress.line_address if self.company.adress else ""


class OrganizationInfoWrapper(BaseWrapper):
    def __init__(self, api_base: HttpUrl, http_session: ClientSession) -> None:
        super().__init__(
            api_base=api_base,  # type: ignore[arg-type]
            http_session=http_session,  # type: ignore[arg-type]
        )

    async def get_user_organization_data(self, tax_id: str) -> DCreateOrganizationDto:
        organization_data = await self._req(
            hdrs.METH_GET, f"counterparty?key={config.organization_info_secret_api_key}&inn={tax_id}", model=InputOrganizationDto
        )
        return DCreateOrganizationDto.model_validate(organization_data)
