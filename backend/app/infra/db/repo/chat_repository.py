from __future__ import annotations

from typing import Iterable, Sequence

from sqlalchemy import Select, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import ChatFile, ChatMessage, ChatSession


class ChatRepository:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_session(self, *, user_id: int, agent_type: str) -> ChatSession:
        chat_session = ChatSession(user_id=user_id, agent_type=agent_type)
        self._session.add(chat_session)
        await self._session.flush()
        return chat_session

    async def save_message(
        self,
        *,
        session_id: int,
        role: str,
        content: str,
        files_metadata: dict | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            files_metadata=files_metadata,
        )
        self._session.add(message)
        await self._session.flush()
        return message

    async def save_files(
        self,
        *,
        message_id: int,
        files: Iterable[dict],
    ) -> Sequence[ChatFile]:
        stored_files: list[ChatFile] = []
        for payload in files:
            chat_file = ChatFile(
                message_id=message_id,
                filename=payload["filename"],
                file_path=payload["file_path"],
                size_bytes=payload.get("size_bytes") or payload.get("size") or 0,
                mime_type=payload.get("mime_type") or payload.get("content_type", ""),
            )
            self._session.add(chat_file)
            stored_files.append(chat_file)
        if stored_files:
            await self._session.flush()
        return stored_files

    async def get_session_history(
        self, *, session_id: int, limit: int = 50
    ) -> Sequence[ChatMessage]:
        stmt: Select[tuple[ChatMessage]] = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        messages = result.scalars().all()
        return list(reversed(messages))

    async def get_user_sessions(
        self, *, user_id: int, limit: int = 10
    ) -> Sequence[ChatSession]:
        stmt: Select[tuple[ChatSession]] = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(desc(ChatSession.created_at))
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_session(
        self, *, session_id: int, user_id: int | None = None
    ) -> ChatSession | None:
        stmt: Select[tuple[ChatSession]] = select(ChatSession).where(
            ChatSession.id == session_id
        )
        if user_id is not None:
            stmt = stmt.where(ChatSession.user_id == user_id)
        result = await self._session.execute(stmt)
        return result.scalars().first()

