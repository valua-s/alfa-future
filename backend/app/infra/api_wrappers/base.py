from __future__ import annotations

import json as js
from typing import TYPE_CHECKING, overload

import attrs
from pydantic import BaseModel, HttpUrl, TypeAdapter

from app.infra.api_wrappers import http

if TYPE_CHECKING:
    from typing import Any, Self

    from aiohttp import ClientSession
    from aiohttp.typedefs import Query


@attrs.define(
    repr=False,
    frozen=True,
    weakref_slot=False,
    kw_only=True,
    eq=False,
    getstate_setstate=False,
    match_args=False,
)
class BaseWrapper:
    _api_base: HttpUrl | str = attrs.field(init=True)
    _http_session: ClientSession = attrs.field(repr=False, init=True)

    @overload
    async def _req[TBaseModel: BaseModel](
        self,
        method: str,
        endpoint: str,
        /,
        *,
        params: Query = None,
        json: Any = None,
        model: type[TBaseModel],
    ) -> TBaseModel: ...
    @overload
    async def _req[TTypeAdapter](
        self,
        method: str,
        endpoint: str,
        /,
        *,
        params: Query = None,
        json: Any = None,
        model: TypeAdapter[TTypeAdapter],
    ) -> TTypeAdapter: ...
    @overload
    async def _req(
        self,
        method: str,
        endpoint: str,
        /,
        *,
        params: Query = None,
        json: Any = None,
        model: None,
    ) -> Any | None: ...

    async def _req[TBaseModel: BaseModel, TTypeAdapter](
        self,
        method: str,
        endpoint: str,
        /,
        *,
        params: Query = None,
        json: Any = None,
        model: type[TBaseModel] | TypeAdapter[TTypeAdapter] | None = None,
    ) -> TBaseModel | TTypeAdapter | Any | None:
        if isinstance(self._api_base, str) and not self._api_base.startswith(
            "http"
        ):
            self._api_base = HttpUrl(f"http://{self._api_base}")
        request = await http.request(
            self._http_session,
            method,
            f"{self._api_base}{endpoint}",
            params=params,
            json=json if json is not None else None,
        )
        req: dict[str, str | dict[str, str]] = js.loads(request.decode("utf-8"))
        match model:
            case None:
                return req
            case TypeAdapter():
                return model.validate_python(req)
            case _:
                return model.model_validate(req, from_attributes=True)

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self._http_session.close()
