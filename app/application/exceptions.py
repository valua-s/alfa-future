from __future__ import annotations

from litestar.exceptions import HTTPException


class InvalidToken(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403, detail="Permission Denied, you need to update token"
        )


class UserNotExists(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403, detail="Permission Denied, user not exists"
        )


class IncorrectUserData(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=401, detail="Incorrect user data"
        )


class UserWithoutOrg(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=400, detail="Необходимо добавить организацию пользователю"
        )
