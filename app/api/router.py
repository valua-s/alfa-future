from __future__ import annotations

from litestar import Router

from app.api.accountain import router as accounting
from app.api.auth import router as auth
from app.api.finance import router as finance
from app.api.lawyer import router as lawyer
from app.api.main_page import router as main_page
from app.api.marketing import router as marketing
from app.api.organization import router as organization
from app.infra.middleware import chat_middleware

api_router = Router(
    path="/api",
    route_handlers=[
        Router(path="/auth", route_handlers=[auth]),
        Router(path="/organization", route_handlers=[organization], middleware=[chat_middleware]),
        Router(path="/main", route_handlers=[main_page], middleware=[chat_middleware]),
        Router(path="/finance", route_handlers=[finance], middleware=[chat_middleware]),
        Router(path="/accounting", route_handlers=[accounting], middleware=[chat_middleware]),
        Router(path="/lawyer", route_handlers=[lawyer], middleware=[chat_middleware]),
        Router(path="/marketing", route_handlers=[marketing], middleware=[chat_middleware]),
    ]
)
