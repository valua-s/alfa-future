from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.infra.config import config
from app.infra.db.repo.exceptions import (
    CommitError,
    RollbackError,
    UnexpectedError,
)

if TYPE_CHECKING:
    import types
    from typing import Self

url = config.db_test_url if config.alembic_run == "test" else config.db_url
engine = create_async_engine(url=url)


@dataclass
class UnitOfWork(AsyncSession):
    def __init__(self) -> None:
        super().__init__(bind=engine)

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None = None,
        exc_val: BaseException | None = None,
        exc_tb: types.TracebackType | None = None,
    ) -> None:
        try:
            if exc_type is None:
                try:
                    await self.commit()
                except SQLAlchemyError as comm_exc:
                    await self._handle_commit_error(comm_exc)
        except Exception as unexpected_exc:
            await self._handle_unexpected_error(unexpected_exc)
        finally:
            await self._safe_close()

    async def _handle_commit_error(self, error: SQLAlchemyError) -> None:
        try:
            await self.rollback()
        except Exception as rollback_exc:
            raise RollbackError(rollback_exc) from rollback_exc
        raise CommitError(error) from error

    async def _handle_unexpected_error(self, error: Exception) -> None:
        try:
            await self.rollback()
        except Exception as rollback_exc:
            raise RollbackError(rollback_exc) from rollback_exc
        raise UnexpectedError(error) from error

    async def _safe_close(self) -> None:
        try:
            if self.is_active:
                await self.close()
        except Exception as close_exc:
            raise UnexpectedError(close_exc) from close_exc
        #     config.logging.error(f"Session close failed: {close_exc}")
