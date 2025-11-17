from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
import time

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
)

from agent.core.model_manager import ModelSlot, model_manager
from agent.core.agent_logger import agent_logger
from agent.core.state import AgentState


@dataclass(slots=True)
class LLMResponse:
    content: str
    raw: dict
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    prompt_ms: float = 0.0
    eval_ms: float = 0.0


@dataclass(slots=True)
class LLMStats:

    calls: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    prompt_ms: float = 0.0
    eval_ms: float = 0.0

    def ingest(self, payload: Dict) -> None:
        usage = payload.get("usage") or {}
        self.prompt_tokens += int(usage.get("prompt_tokens", 0))
        self.completion_tokens += int(usage.get("completion_tokens", 0))
        self.total_tokens += int(usage.get("total_tokens", 0))

        timings = payload.get("timings") or {}
        self.prompt_ms += float(timings.get("prompt_ms", 0.0))
        self.eval_ms += float(timings.get("eval_ms", 0.0))
        self.calls += 1

    @property
    def tokens_per_second(self) -> float:
        total_ms = self.prompt_ms + self.eval_ms
        if total_ms <= 0 or self.total_tokens == 0:
            return 0.0
        return self.total_tokens / (total_ms / 1000)

    def to_dict(self) -> dict:
        return {
            "calls": self.calls,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "prompt_ms": round(self.prompt_ms, 2),
            "eval_ms": round(self.eval_ms, 2),
            "tokens_per_second": round(self.tokens_per_second, 2),
        }


_llm_stats = LLMStats()


def reset_llm_stats() -> None:
    global _llm_stats
    _llm_stats = LLMStats()


def get_llm_stats() -> LLMStats:
    return _llm_stats


def _convert_message(message: BaseMessage | str) -> dict:
    if isinstance(message, str):
        return {"role": "user", "content": message}
    if isinstance(message, SystemMessage):
        return {"role": "system", "content": message.content}
    if isinstance(message, HumanMessage):
        return {"role": "user", "content": message.content}
    if isinstance(message, AIMessage):
        return {"role": "assistant", "content": message.content}
    # fallback
    return {"role": getattr(message, "type", "user"), "content": message.content}


def _convert_messages(messages: Iterable[BaseMessage | str]) -> List[dict]:
    return [_convert_message(msg) for msg in messages]


def _preview_messages(payload: List[dict], max_chars: int = 400) -> str:
    chunks: List[str] = []
    for item in payload:
        role = item.get("role", "user")
        content = str(item.get("content", ""))
        chunks.append(f"{role.upper()}: {content}")
        if len("\n".join(chunks)) >= max_chars:
            break
    text = "\n".join(chunks)
    if len(text) > max_chars:
        return text[: max_chars - 3] + "..."
    return text


def invoke_llm(
    slot: ModelSlot,
    messages: Iterable[BaseMessage | str],
    *,
    temperature: float = 0.1,
    max_tokens: int = 1024,
    top_p: float = 0.95,
    state: Optional[AgentState] = None,
    node: str = "llm",
) -> LLMResponse:
    payload = _convert_messages(messages)
    prompt_preview = _preview_messages(payload)
    if state is not None:
        agent_logger.log_llm_pending(
            state,
            node=node,
            slot=slot,
            prompt_preview=prompt_preview,
        )
    start = time.perf_counter()
    with model_manager.use(slot) as llm:
        response = llm.create_chat_completion(
            messages=payload,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
        )
    duration_ms = (time.perf_counter() - start) * 1000
    _llm_stats.ingest(response)
    text = response["choices"][0]["message"]["content"]
    usage = response.get("usage") or {}
    timings = response.get("timings") or {}
    prompt_tokens = int(usage.get("prompt_tokens", 0))
    completion_tokens = int(usage.get("completion_tokens", 0))
    total_tokens = int(usage.get("total_tokens", prompt_tokens + completion_tokens))
    prompt_ms = float(timings.get("prompt_ms", 0.0))
    eval_ms = float(timings.get("eval_ms", 0.0))

    if state is not None:
        agent_logger.log_llm_call(
            state,
            node=node,
            slot=slot,
            prompt_preview=prompt_preview,
            response_preview=text[:400],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            duration_ms=duration_ms,
        )

    return LLMResponse(
        content=text,
        raw=response,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        prompt_ms=prompt_ms,
        eval_ms=eval_ms,
    )


def invoke_orchestrator(
    messages: Iterable[BaseMessage | str],
    *,
    state: Optional[AgentState] = None,
    node: str = "orchestrator",
    **kwargs,
) -> LLMResponse:
    defaults = {"temperature": 0.1, "max_tokens": 2048}
    defaults.update(kwargs)
    return invoke_llm("orchestrator", messages, state=state, node=node, **defaults)


def invoke_executor(
    messages: Iterable[BaseMessage | str],
    *,
    state: Optional[AgentState] = None,
    node: str = "executor",
    **kwargs,
) -> LLMResponse:
    defaults = {"temperature": 0.2, "max_tokens": 1024}
    defaults.update(kwargs)
    return invoke_llm("executor", messages, state=state, node=node, **defaults)


