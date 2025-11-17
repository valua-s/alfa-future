from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import secrets
from typing import Any, Iterable

from litestar import Request, Router, post, websocket
from litestar.connection import WebSocket
from litestar.datastructures import UploadFile
from litestar.exceptions import WebSocketDisconnect

from app.application.auth import AuthenticationService
from app.application.exceptions import InvalidToken
from app.infra.agent_bridge import AgentAttachment, run_agent_with_streaming
from app.infra.db.repo import ChatRepository
from app.infra.db.repo.uow import UnitOfWork

router = Router(path="", tags=["Agent"])
auth_service = AuthenticationService()

ALLOWED_AGENTS = {"financier", "lawyer", "marketer", "accountant"}
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "storage" / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
MAX_FILE_AGE = timedelta(hours=24)
CHUNK_SIZE = 1024 * 1024


@router.register
@websocket("/ws", name="agent-stream")
async def agent_websocket(socket: WebSocket[Any, Any, Any]) -> None:
    await socket.accept()
    try:
        user = _authenticate_socket(socket)
    except InvalidToken:
        await socket.send_json({"type": "error", "message": "invalid_token"})
        await socket.close(code=4403)
        return

    await socket.send_json({"type": "connected", "user_id": user.id})

    while True:
        try:
            payload = await socket.receive_json()
        except WebSocketDisconnect:
            return

        if payload.get("type") != "user_message":
            await socket.send_json(
                {"type": "error", "message": "unsupported_message_type"}
            )
            continue

        agent_type = payload.get("agent")
        if agent_type not in ALLOWED_AGENTS:
            await socket.send_json({"type": "error", "message": "invalid_agent"})
            continue

        text = (payload.get("text") or "").strip()
        if not text:
            await socket.send_json({"type": "error", "message": "empty_message"})
            continue

        attachments = _parse_attachments(payload.get("files") or [])
        requested_session_id = payload.get("session_id")
        session_id: int | None = None
        if requested_session_id is not None:
            try:
                session_id = int(requested_session_id)
            except (TypeError, ValueError):
                await socket.send_json(
                    {"type": "error", "message": "invalid_session_identifier"}
                )
                continue

        async with UnitOfWork() as uow:
            repository = ChatRepository(uow)
            if session_id is not None:
                session = await repository.get_session(
                    session_id=session_id, user_id=user.id
                )
                if session is None:
                    await socket.send_json(
                        {"type": "error", "message": "session_not_found"}
                    )
                    continue
            await run_agent_with_streaming(
                websocket=socket,
                repository=repository,
                user_id=user.id,
                agent_type=agent_type,
                text=text,
                attachments=attachments,
                session_id=session_id,
            )


@router.register
@post("/upload", name="agent-upload")
async def upload_agent_files(
    request: Request[Any, Any, Any],
    files: list[UploadFile],
) -> dict[str, Any]:
    token = _extract_token_from_headers(request)
    user = auth_service.verify_token(token)
    stored_files = [
        await _store_uploaded_file(upload=upload, user_id=user.id) for upload in files
    ]
    _cleanup_expired_uploads(base_dir=list(UPLOAD_ROOT.iterdir()))
    return {"files": stored_files}


def _authenticate_socket(socket: WebSocket[Any, Any, Any]):
    token = socket.query_params.get("token")
    if not token:
        auth_header = socket.headers.get("authentication", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:]
    if not token:
        raise InvalidToken
    return auth_service.verify_token(token)


def _parse_attachments(items: list[dict[str, Any]]) -> list[AgentAttachment]:
    attachments: list[AgentAttachment] = []
    for item in items:
        path = item.get("path") or item.get("file_path")
        if not path:
            continue
        attachments.append(
            AgentAttachment(
                path=path,
                filename=item.get("filename") or Path(path).name,
                mime_type=item.get("mime_type") or "application/octet-stream",
                size_bytes=int(item.get("size_bytes") or item.get("size") or 0),
            )
        )
    return attachments


def _extract_token_from_headers(request: Request[Any, Any, Any]) -> str:
    auth_header = request.headers.get("authentication", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:]
    raise InvalidToken


async def _store_uploaded_file(*, upload: UploadFile, user_id: int) -> dict[str, Any]:
    filename = Path(upload.filename or "file").name
    suffix = Path(filename).suffix
    unique_name = (
        f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}{suffix}"
    )
    user_dir = UPLOAD_ROOT / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    target_path = user_dir / unique_name

    size = 0
    with target_path.open("wb") as destination:
        while chunk := await upload.read(CHUNK_SIZE):
            size += len(chunk)
            destination.write(chunk)
    await upload.close()

    return {
        "id": secrets.token_hex(8),
        "path": str(target_path),
        "filename": filename,
        "mime_type": upload.content_type or "application/octet-stream",
        "size_bytes": size,
    }


def _cleanup_expired_uploads(*, base_dir: Iterable[Path]) -> None:
    cutoff = datetime.now(timezone.utc) - MAX_FILE_AGE
    for entry in base_dir:
        if not entry.exists():
            continue
        if entry.is_dir():
            _cleanup_expired_uploads(base_dir=entry.iterdir())
            try:
                next(entry.iterdir())
            except StopIteration:
                entry.rmdir()
            continue
        mtime = datetime.fromtimestamp(entry.stat().st_mtime, timezone.utc)
        if mtime < cutoff:
            entry.unlink(missing_ok=True)

