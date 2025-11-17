from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass
from typing import Any, Iterable, Sequence

from litestar.connection import WebSocket

from agent.core.agent_logger import agent_logger
from agent.core.graph import agent_graph
from agent.core.llm import get_llm_stats, reset_llm_stats
from agent.core.model_manager import model_manager
from agent.core.state import AgentState, initial_state
from app.infra.db.repo import ChatRepository


@dataclass(slots=True)
class AgentAttachment:
    path: str
    filename: str
    mime_type: str
    size_bytes: int

    def to_metadata(self) -> dict[str, Any]:
        return asdict(self)


async def run_agent_with_streaming(
    *,
    websocket: WebSocket,
    repository: ChatRepository,
    user_id: int,
    agent_type: str,
    text: str,
    attachments: Sequence[AgentAttachment] | None = None,
    session_id: int | None = None,
) -> dict[str, Any]:

    attachments = list(attachments or [])
    files_metadata = [item.to_metadata() for item in attachments]
    if session_id is None:
        session = await repository.create_session(user_id=user_id, agent_type=agent_type)
        session_id = session.id

    user_message = await repository.save_message(
        session_id=session_id,
        role="user",
        content=text,
        files_metadata=files_metadata or None,
    )
    if files_metadata:
        await repository.save_files(message_id=user_message.id, files=files_metadata)

    await websocket.send_json(
        {
            "type": "session_ready",
            "session_id": session_id,
            "user_message_id": user_message.id,
            "attachments": files_metadata,
        }
    )

    loop = asyncio.get_running_loop()
    event_queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    def _on_agent_event(state: AgentState, event: dict[str, Any]) -> None:
        loop.call_soon_threadsafe(event_queue.put_nowait, event)

    agent_logger.subscribe(_on_agent_event)
    forwarder = asyncio.create_task(
        _forward_events(event_queue=event_queue, websocket=websocket, session_id=session_id)
    )

    state = initial_state(query=text, files=[item.path for item in attachments])

    try:
        result = await asyncio.to_thread(_invoke_agent, state)
        final_answer = result.get("final_answer") or ""
        agent_message = await repository.save_message(
            session_id=session_id,
            role="agent",
            content=final_answer,
            files_metadata=None,
        )
        await websocket.send_json(
            {
                "type": "agent_response",
                "session_id": session_id,
                "answer": final_answer,
                "plan": result.get("plan", []),
                "tool_results": result.get("tool_results", []),
                "events": result.get("events", []),
                "llm_stats": result.get("llm_stats", {}),
                "llm_backend": result.get("llm_backend", {}),
                "agent_message_id": agent_message.id,
            }
        )
        return {
            "session_id": session_id,
            "user_message_id": user_message.id,
            "agent_message_id": agent_message.id,
            "result": result,
        }
    except Exception as exc:  # pragma: no cover - best effort
        await websocket.send_json(
            {
                "type": "agent_error",
                "session_id": session_id,
                "message": str(exc),
            }
        )
        raise
    finally:
        agent_logger.unsubscribe(_on_agent_event)
        await event_queue.put(None)
        await forwarder


def _invoke_agent(state: AgentState) -> AgentState:
    reset_llm_stats()
    result = agent_graph.invoke(state)
    result["llm_stats"] = get_llm_stats().to_dict()
    result["llm_backend"] = model_manager.backend_report()
    return result


async def _forward_events(
    *, event_queue: asyncio.Queue[dict[str, Any] | None], websocket: WebSocket, session_id: int
) -> None:
    while True:
        event = await event_queue.get()
        if event is None:
            return
        try:
            await websocket.send_json(
                {
                    "type": "agent_event",
                    "session_id": session_id,
                    "event": event,
                }
            )
        except Exception:
            return

