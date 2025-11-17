from __future__ import annotations

from typing import Annotated, Any

from litestar import Request, Router, get, post
from litestar.enums import RequestEncodingType
from litestar.params import Body

from app.api.schemas import OrganizationInfo, UserOrganizaitonDto
from app.application.organization import OrganizationService

router = Router("", route_handlers=(), tags=["Организация"])
service = OrganizationService()


@router.register
@get("/organization-info")
async def get_organization_info(
    request: Request[Any, Any, Any],
) -> OrganizationInfo:
    raw_data = await service.get_user_organization(request.headers.get("authentication"))
    return OrganizationInfo(
        organization_name=raw_data.legal_name, tax_id=raw_data.tax_id
    )


@router.register
@post("/add_organization", summary="Добавить огранизацию пользователю")
async def add_organization_to_user(
    request: Request[Any, Any, Any],
    data: Annotated[UserOrganizaitonDto,
                    Body(media_type=RequestEncodingType.JSON)],
) -> dict[str, str]:
    await service.add_organization_to_user(request.headers.get("authentication"), data.tax_id)
    return {"message": "Огранизация успешно добавлена"}
