from __future__ import annotations

import json
import time
from typing import Any, Dict, Iterable, List

from langgraph.graph import END, START, StateGraph
from langchain_core.messages import HumanMessage

from agent.core.llm import invoke_orchestrator
from agent.core.agent_logger import agent_logger
from agent.core.state import AgentState, PlanStep, ToolExecution
from agent.prompts.planner import planner_prompt
from agent.prompts.reflector import reflector_prompt
from agent.prompts.synthesizer import synthesizer_prompt
from agent.tools.document_loader import document_loader
from agent.tools.financial import financial_tool
from agent.tools.legal_rag import legal_rag_tool
from agent.tools.marketing import PromotionBrief, marketing_tool

MAX_PLANNER_RETRIES = 2


TOOL_REGISTRY = {
    financial_tool.name: financial_tool,
    legal_rag_tool.name: legal_rag_tool,
    marketing_tool.name: marketing_tool,
    "document_loader": document_loader,
}


def describe_tools() -> str:
    descriptions = [
        f"{financial_tool.name}: {financial_tool.description}",
        f"{legal_rag_tool.name}: {legal_rag_tool.description} Работает даже без файлов, использует локальный индекс.",
        f"{marketing_tool.name}: {marketing_tool.description}",
        "document_loader: Читает содержимое переданных файлов и возвращает очищенный текст.",
    ]
    return "\n".join(f"- {item}" for item in descriptions)


def _parse_plan_json(text: str) -> list[PlanStep]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    plan: list[PlanStep] = []
    for idx, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            continue
        tool = str(item.get("tool", "")).strip()
        if not tool:
            continue
        params = item.get("params")
        params = params if isinstance(params, dict) else {}
        plan.append(
            {
                "step": int(item.get("step") or idx),
                "tool": tool,
                "action": str(item.get("action", "") or "").strip(),
                "params": params,
            }
        )
    return plan


def _planner_retry_messages(messages: Iterable[Any], attempt: int, bad_output: str) -> list[Any]:
    prompt = (
        "ПРЕДЫДУЩИЙ ОТВЕТ НЕ БЫЛ ВАЛИДНЫМ JSON массивом. "
        "Верни ТОЛЬКО JSON без пояснений. "
        f"Ответ попытки #{attempt}: {bad_output}"
    )
    retry_message = HumanMessage(content=prompt)
    return [*messages, retry_message]


def planner_node(state: AgentState) -> AgentState:
    node_name = "planner"
    start = time.perf_counter()
    agent_logger.log_node_enter(node_name, state)
    base_messages = planner_prompt.format_messages(
        query=state["query"],
        tool_descriptions=describe_tools(),
        files=", ".join(state.get("files", []) or ["(нет файлов)"]),
    )
    messages: List[Any] = list(base_messages)
    plan: list[PlanStep] = []
    last_output = ""
    for attempt in range(1, MAX_PLANNER_RETRIES + 1):
        response = invoke_orchestrator(messages, state=state, node=node_name)
        last_output = getattr(response, "content", "[]")
        plan = _parse_plan_json(last_output)
        if plan:
            break
        messages = _planner_retry_messages(base_messages, attempt, last_output)

    state["plan"] = plan
    state["current_step"] = 0
    agent_logger.log_node_exit(node_name, state, duration_ms=(time.perf_counter() - start) * 1000)
    return state


def executor_node(state: AgentState) -> AgentState:
    node_name = "executor"
    start = time.perf_counter()
    agent_logger.log_node_enter(node_name, state)
    plan = state.get("plan", [])
    index = state.get("current_step", 0)
    if not plan or index >= len(plan):
        agent_logger.log_node_exit(node_name, state, duration_ms=(time.perf_counter() - start) * 1000)
        return state

    step = plan[index]
    result_text, success, error = run_tool(step, state)
    execution: ToolExecution = {
        "step": step.get("step", index + 1),
        "tool": step.get("tool", "unknown"),
        "input": step.get("action", ""),
        "output": result_text,
        "success": success,
    }
    if error:
        execution["error"] = error
    state.setdefault("tool_results", []).append(execution)
    state["current_step"] = index + 1
    agent_logger.log_node_exit(node_name, state, duration_ms=(time.perf_counter() - start) * 1000)
    return state


def reflect_node(state: AgentState) -> AgentState:
    node_name = "reflector"
    start = time.perf_counter()
    agent_logger.log_node_enter(node_name, state)
    messages = reflector_prompt.format_messages(
        query=state["query"],
        current_step=state.get("current_step", 0),
        plan=json.dumps(state.get("plan", []), ensure_ascii=False),
        tool_results=json.dumps(state.get("tool_results", []), ensure_ascii=False),
    )
    response = invoke_orchestrator(messages, state=state, node=node_name)

    reflection_raw = getattr(response, "content", "{}")
    try:
        data = json.loads(reflection_raw)
    except json.JSONDecodeError:
        data = {"continue": False, "reason": reflection_raw}

    state["reflection"] = data.get("reason", "нет данных")
    state["decision"] = bool(data.get("continue", False))
    state["iteration"] = state.get("iteration", 0) + 1
    agent_logger.log_node_exit(node_name, state, duration_ms=(time.perf_counter() - start) * 1000)
    return state


def synthesize_node(state: AgentState) -> AgentState:
    node_name = "synthesizer"
    start = time.perf_counter()
    agent_logger.log_node_enter(node_name, state)
    messages = synthesizer_prompt.format_messages(
        query=state["query"],
        plan=json.dumps(state.get("plan", []), ensure_ascii=False),
        tool_results=json.dumps(state.get("tool_results", []), ensure_ascii=False),
        reflection=state.get("reflection", ""),
    )
    response = invoke_orchestrator(messages, state=state, node=node_name)
    state["final_answer"] = getattr(response, "content", "")
    agent_logger.log_node_exit(node_name, state, duration_ms=(time.perf_counter() - start) * 1000)
    return state


def should_continue(state: AgentState) -> str:
    if state.get("decision"):
        if state.get("iteration", 0) > 9:
            return "finish"
        if state.get("current_step", 0) >= len(state.get("plan", [])):
            return "finish"
        return "continue"
    return "finish"


def run_tool(step: PlanStep, state: AgentState) -> tuple[str, bool, str | None]:
    tool_name = (step.get("tool") or "").strip()
    params = step.get("params", {}) if isinstance(step, dict) else {}
    action = step.get("action", "")
    if not tool_name:
        raise ValueError("Не указан инструмент для шага")

    extra: Dict[str, Any] | None = None
    start = time.perf_counter()
    success = True
    error: str | None = None
    result_text = ""

    try:
        if tool_name == financial_tool.name:
            files = params.get("files") or state.get("files", [])
            result_text, summary = financial_tool.analyze_with_metadata(
                files, action or state["query"], state=state
            )
            extra = {"files": summary}
        elif tool_name == legal_rag_tool.name:
            query = params.get("query") or action or state["query"]
            k = int(params.get("k", 3))
            results = legal_rag_tool.search(query, k=k)
            extra = {
                "query": query,
                "k": k,
                "hits": [{"path": item["path"], "score": item["score"]} for item in results],
            }
            result_text = json.dumps(results, ensure_ascii=False, indent=2)
        elif tool_name == marketing_tool.name:
            mode = params.get("mode", "promotion")
            if mode == "social_post":
                result_text = marketing_tool.create_social_post(
                    topic=params.get("topic", action or state["query"]),
                    tone=params.get("tone", "дружелюбный"),
                    state=state,
                )
            elif mode == "roi":
                result_text = marketing_tool.estimate_roi(
                    expected_revenue=float(params.get("expected_revenue", 0)),
                    budget=float(params.get("budget", 1)),
                    state=state,
                )
            else:
                brief = PromotionBrief(
                    goal=params.get("goal", action or state["query"]),
                    audience=params.get("audience", "гости кофейни"),
                    budget=params.get("budget"),
                    duration_days=params.get("duration_days"),
                )
                result_text = marketing_tool.generate_promotion(brief, state=state)
            extra = {"mode": mode}
        elif tool_name == "document_loader":
            files = params.get("files") or state.get("files", [])
            docs = document_loader.load_many(files)
            summary = []
            for doc in docs:
                path = doc.get("path", "")
                text = doc.get("text", "") or ""
                meta = {
                    "path": path,
                    "chars": len(text),
                    "lines": text.count("\n") + 1 if text else 0,
                    "metadata": doc.get("metadata", {}),
                }
                summary.append(meta)
                if path:
                    agent_logger.log_document_load(
                        state,
                        path=path,
                        metadata={k: v for k, v in meta.items() if k != "path"},
                    )
            extra = {"documents": summary}
            result_text = json.dumps(docs, ensure_ascii=False, indent=2)
        else:
            raise ValueError(f"Неизвестный инструмент: {tool_name}")
    except Exception as exc:  # pragma: no cover - defensive
        success = False
        error = str(exc)
        result_text = f"Ошибка при выполнении {tool_name}: {exc}"

    duration_ms = (time.perf_counter() - start) * 1000
    agent_logger.log_tool_call(
        state,
        node="executor",
        tool=tool_name,
        input_data={"action": action, "params": params},
        output_preview=result_text[:400],
        duration_ms=duration_ms,
        success=success,
        error=error,
        extra=extra,
    )
    return result_text, success, error


graph = StateGraph(AgentState)
graph.add_node("planner", planner_node)
graph.add_node("executor", executor_node)
graph.add_node("reflector", reflect_node)
graph.add_node("synthesizer", synthesize_node)

graph.add_edge(START, "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", "reflector")
graph.add_conditional_edges("reflector", should_continue, {"continue": "executor", "finish": "synthesizer"})
graph.add_edge("synthesizer", END)

agent_graph = graph.compile()


