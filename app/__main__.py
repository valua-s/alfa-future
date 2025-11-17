from __future__ import annotations

import asyncio

import uvicorn
import uvloop
from dishka import make_async_container
from dishka.async_container import AsyncContextWrapper
from dishka.integrations.litestar import setup_dishka
from litestar import Litestar
from litestar.config.cors import CORSConfig
from litestar.config.csrf import CSRFConfig
from litestar.logging import LoggingConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import JsonRenderPlugin, SwaggerRenderPlugin
from litestar.openapi.spec import Components, SecurityScheme
from litestar.static_files import create_static_files_router

from app.api.router import api_router
from app.infra import ioc
from app.infra.config import config


async def _main() -> None:
    async with AsyncContextWrapper(
        make_async_container(ioc.MainProvider())
    ) as container:
        app = Litestar(
            route_handlers=(
                create_static_files_router("/static", ["static"]),
                api_router,
            ),
            cors_config=CORSConfig(
                allow_origins=["*"],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            ),
            csrf_config=CSRFConfig(
                secret="",
                cookie_name="XSRF-TOKEN",
                header_name="x-xsrf-token",
                exclude=r"^.*$",
            ),
            logging_config=LoggingConfig(
                formatters={
                    "standard": {
                        "format": "%(asctime)s | %(levelname)-8s | %(name)s: %(message)s"
                    }
                },
                handlers={
                    "console": {
                        "class": "logging.StreamHandler",
                        "formatter": "standard",
                        "level": "NOTSET",
                    },
                    "queue_listener": {
                        "class": "logging.handlers.QueueHandler",
                        "handlers": ["console"],
                        "level": "NOTSET",
                        "listener": "litestar.logging.standard.LoggingQueueListener",
                        "queue": {"()": "queue.Queue", "maxsize": -1},
                    },
                },
                loggers={"litestar": {}},
                root={"handlers": ["queue_listener"], "level": "INFO"},
                log_exceptions="always",
            ),
            openapi_config=OpenAPIConfig(
                title="AlfaFutureAiAssistaint",
                version="1.0.0",
                components=Components(
                    security_schemes={
                        "LoginHeader": SecurityScheme(
                            type="apiKey",
                            name="authentication",
                            security_scheme_in="header",
                            description="Bearer token authentication",
                        )
                    }
                ),
                security=[{"LoginHeader": []}],
                render_plugins=(
                    SwaggerRenderPlugin(
                        js_url=f"{config.base_api_url}/static/swagger-ui-bundle.js",
                        css_url=f"{config.base_api_url}/static/swagger-ui.css",
                        standalone_preset_js_url=f"{config.base_api_url}/static/swagger-ui-standalone-preset.js",
                        # favicon="<link rel='icon' href='static/favicon.svg'>",
                    ),
                    JsonRenderPlugin(),
                ),
            ),
            path=config.base_api_url,
        )
        setup_dishka(container, app)
        await uvicorn.Server(
            uvicorn.Config(
                app,
                host="0.0.0.0",  # noqa: S104
                port=8000,
                log_config=None,
                server_header=False,
                use_colors=False,
            )
        ).serve()


if __name__ == "__main__":
    asyncio.run(_main(), loop_factory=uvloop.Loop)
