from __future__ import annotations

import asyncio

import bcrypt


class SecurityService:

    @staticmethod
    def get_password_hash_sync(password: str) -> str:
        pwd_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt)
        return hashed_password.decode("utf-8")

    async def get_password_hash(self, password: str) -> str:
        return await asyncio.to_thread(self.get_password_hash_sync, password)

    @staticmethod
    def verify_password_sync(plain_password: str, hashed_password: str) -> bool:
        plain_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)

    async def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return await asyncio.to_thread(
            self.verify_password_sync, plain_password, hashed_password
        )
