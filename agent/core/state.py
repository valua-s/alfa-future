from __future__ import annotations

from typing import Any, List, Optional, TypedDict


class PlanStep(TypedDict, total=False):
    step: int
    tool: str
    action: str
    params: dict[str, Any]


class ToolExecution(TypedDict, total=False):
    step: int
    tool: str
    input: str
    output: str
    success: bool
    error: Optional[str]


class AgentEvent(TypedDict, total=False):
    timestamp: float
    node: str
    event_type: str
    details: dict[str, Any]


class AgentState(TypedDict, total=False):

    query: str
    files: List[str]
    plan: List[PlanStep]
    current_step: int
    tool_results: List[ToolExecution]
    reflection: Optional[str]
    decision: Optional[bool]
    final_answer: Optional[str]
    iteration: int
    scratchpad: List[str]
    events: List[AgentEvent]
    loaded_documents: List[dict[str, Any]]
    llm_calls: List[dict[str, Any]]


def initial_state(query: str, files: list[str]) -> AgentState:
    return {
        "query": query,
        "files": files,
        "plan": [],
        "current_step": 0,
        "tool_results": [],
        "reflection": None,
        "decision": None,
        "final_answer": None,
        "iteration": 0,
        "scratchpad": [],
        "events": [],
        "loaded_documents": [],
        "llm_calls": [],
    }


