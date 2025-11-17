# ruff: noqa: PLR6301
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import aiohttp
from aiohttp import ClientSession
from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.infra.api_wrappers.organization_info_wrapper import (
    OrganizationInfoWrapper,
)
from app.infra.config import config

type DbSessionFactory = async_sessionmaker[AsyncSession]


class MainProvider(Provider):
    scope = Scope.APP

    @provide
    async def http_session(self) -> AsyncIterator[ClientSession]:
        session = ClientSession()
        try:
            yield session
        finally:
            await session.close()


@asynccontextmanager
async def create_organization_wrapper() -> AsyncIterator[OrganizationInfoWrapper]:
    session = ClientSession(connector=aiohttp.TCPConnector(ssl=False))
    try:
        wrapper = OrganizationInfoWrapper(
            api_base=config.organization_info_api_url,
            http_session=session
        )
        yield wrapper
    finally:
        await session.close()
