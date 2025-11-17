from __future__ import annotations

from litestar import status_codes
from litestar.exceptions import HTTPException


class CommitError(HTTPException):
    """Ошибка при создании."""
    def __init__(self, detail: Exception | None = None) -> None:
        super().__init__(
            status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"При создании возникло исключение: {detail!s}.",
        )


class RollbackError(HTTPException):
    """Ошибка при откате."""
    def __init__(self, detail: Exception | None = None) -> None:
        super().__init__(
            status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"При откате возникло исключение: {detail!s}.",
        )


class UnexpectedError(HTTPException):
    """Непредвиденная ошибка."""
    def __init__(self, detail: Exception | None = None) -> None:
        super().__init__(
            status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Возникла некая непредвиденная ошибка: {detail!s}.",
        )
