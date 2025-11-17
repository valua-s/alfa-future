from __future__ import annotations

import time
from typing import Any, Callable, List

from agent.core.state import AgentEvent, AgentState


EventCallback = Callable[[AgentState, AgentEvent], None]


class AgentLogger:

    def __init__(self) -> None:
        self._subscribers: List[EventCallback] = []

    def subscribe(self, callback: EventCallback) -> None:
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    def unsubscribe(self, callback: EventCallback) -> None:
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    def reset_subscribers(self) -> None:
        self._subscribers.clear()

    def log_event(
        self,
        state: AgentState,
        *,
        node: str,
        event_type: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        event: AgentEvent = {
            "timestamp": time.time(),
            "node": node,
            "event_type": event_type,
            "details": details or {},
        }
        state.setdefault("events", []).append(event)
        for callback in self._subscribers:
            try:
                callback(state, event)
            except Exception:
                continue

    def log_node_enter(self, node: str, state: AgentState) -> None:
        self.log_event(state, node=node, event_type="node_enter")

    def log_node_exit(self, node: str, state: AgentState, *, duration_ms: float) -> None:
        self.log_event(
            state,
            node=node,
            event_type="node_exit",
            details={"duration_ms": duration_ms},
        )

    def log_tool_call(
        self,
        state: AgentState,
        *,
        node: str,
        tool: str,
        input_data: dict[str, Any],
        output_preview: str,
        duration_ms: float,
        success: bool,
        error: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        details = {
            "tool": tool,
            "input": input_data,
            "output_preview": output_preview,
            "duration_ms": duration_ms,
            "success": success,
        }
        if error:
            details["error"] = error
        if extra:
            details["extra"] = extra
        self.log_event(state, node=node, event_type="tool_call", details=details)

    def log_llm_call(
        self,
        state: AgentState,
        *,
        node: str,
        slot: str,
        prompt_preview: str,
        response_preview: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        duration_ms: float,
    ) -> None:
        details = {
            "slot": slot,
            "prompt_preview": prompt_preview,
            "response_preview": response_preview,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "duration_ms": duration_ms,
        }
        state.setdefault("llm_calls", []).append(details)
        self.log_event(state, node=node, event_type="llm_call", details=details)

    def log_llm_pending(
        self,
        state: AgentState,
        *,
        node: str,
        slot: str,
        prompt_preview: str,
    ) -> None:
        self.log_event(
            state,
            node=node,
            event_type="llm_call_pending",
            details={
                "slot": slot,
                "prompt_preview": prompt_preview,
            },
        )

    def log_document_load(
        self,
        state: AgentState,
        *,
        path: str,
        metadata: dict[str, Any],
    ) -> None:
        record = {"path": path, **metadata}
        state.setdefault("loaded_documents", []).append(record)
        self.log_event(
            state,
            node="document_loader",
            event_type="document_load",
            details=record,
        )


agent_logger = AgentLogger()


