from __future__ import annotations

from typing import Annotated, Literal

from pydantic import Field, HttpUrl, SecretStr
from pydantic_settings import BaseSettings
from sqlalchemy import URL

type _NonBlankStr = Annotated[str, Field(min_length=1)]
type _NonBlankSecretStr = Annotated[SecretStr, Field(min_length=1)]
type _Port = Annotated[int, Field(ge=0, le=65535)]


class _Settings(BaseSettings):
    model_config = {"frozen": True, "env_file": ".env", "extra": "allow"}

    secret_key: _NonBlankStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    base_api_url: _NonBlankStr

    alembic_run: Literal["local", "develop"]

    alfa_future_service_postgres_db: _NonBlankStr
    alfa_future_service_postgres_user: _NonBlankStr
    alfa_future_service_postgres_password: _NonBlankSecretStr
    alfa_future_service_postgres_host: _NonBlankStr
    alfa_future_service_postgres_port: _Port
    alfa_future_service_postgres_out_port: _Port

    organization_info_secret_api_key: _NonBlankStr
    organization_info_api_url: HttpUrl

    @property
    def db_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=config.alfa_future_service_postgres_user,
            password=config.alfa_future_service_postgres_password.get_secret_value(),
            host=config.alfa_future_service_postgres_host,
            port=config.alfa_future_service_postgres_port,
            database=config.alfa_future_service_postgres_db,
        )

    @property
    def db_local_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=config.alfa_future_service_postgres_user,
            password=config.alfa_future_service_postgres_password.get_secret_value(),
            host="localhost",
            port=config.alfa_future_service_postgres_out_port,
            database=config.alfa_future_service_postgres_db,
        )


config = _Settings()
