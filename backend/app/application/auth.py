from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.api.schemas import UserDataResponseDto, UserLoginDto, UserResponseDto
from app.application.exceptions import IncorrectUserData, InvalidToken
from app.application.security import SecurityService
from app.domain.dao import UserDao
from app.infra.config import config

security_service = SecurityService()


class AuthenticationService:
    def __init__(self) -> None:
        self.user_service = UserDao()

    async def login(self, data: UserLoginDto) -> UserResponseDto:
        user_data = await self.authenticate_user(data.username, data.password.get_secret_value())
        access_token = await self.create_access_token(user_data)
        return UserResponseDto(
            access_token=access_token,
            user=user_data
        )

    @staticmethod
    async def create_access_token(data: UserDataResponseDto) -> str:
        expire = datetime.now(UTC) + timedelta(minutes=config.access_token_expire_minutes)
        to_encode = data.model_dump(exclude={"hashed_password"})
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, config.secret_key, algorithm=config.algorithm)

    @staticmethod
    def verify_token(token: str) -> UserDataResponseDto:
        try:
            payload: dict[str, Any] = jwt.decode(token, config.secret_key, algorithms=config.algorithm)
            return UserDataResponseDto.model_validate(payload, from_attributes=True)
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            raise InvalidToken from e

    async def authenticate_user(self, username: str, password: str) -> UserDataResponseDto:
        user = await self.user_service.get_user_by_username(username)
        if not user or not (await security_service.verify_password(password, user.hashed_password)):
            raise IncorrectUserData
        return UserDataResponseDto.model_validate(user.model_dump(exclude={"hashed_password"}))
