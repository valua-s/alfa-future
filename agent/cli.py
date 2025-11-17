from __future__ import annotations

import json
import time
from collections import OrderedDict, defaultdict
from functools import lru_cache
from pathlib import Path
from typing import Callable, List, Optional, Sequence

import typer
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.tree import Tree

from agent.config import ModelSpec, llama_config
from agent.core.agent_logger import agent_logger
from agent.core.llm import get_llm_stats, reset_llm_stats
from agent.core.model_downloader import model_downloader
from agent.core.model_manager import model_manager
from agent.core.state import AgentState, initial_state
from agent.tools.document_loader import DocumentLoader
from agent.tools.legal_rag import legal_rag_tool
try:
    import tiktoken
except ImportError:  # pragma: no cover - optional dependency
    tiktoken = None  # type: ignore[assignment]


app = typer.Typer(add_completion=False)
models_app = typer.Typer(help="Управление GGUF моделями")
app.add_typer(models_app, name="models")
console = Console()
document_loader = DocumentLoader()

NODE_LABELS = {
    "planner": "Планировщик",
    "executor": "Исполнитель",
    "reflector": "Рефлектор",
    "synthesizer": "Синтезатор",
    "document_loader": "Загрузка документов",
}

NODE_ICONS = {
    "planner": "🧠",
    "executor": "⚙️",
    "reflector": "🔁",
    "synthesizer": "🧾",
    "document_loader": "📄",
}

MODEL_TARGETS: Sequence[tuple[str, str, ModelSpec]] = (
    ("orchestrator", "Оркестратор", llama_config.orchestrator),
    ("executor", "Исполнитель", llama_config.executor),
)
MODELS_READY = False


def ensure_models(download: bool = True) -> None:
    """Ensure all required GGUF weights exist locally."""

    global MODELS_READY
    if MODELS_READY:
        return

    missing: List[tuple[str, ModelSpec]] = []
    for _, label, spec in MODEL_TARGETS:
        path = llama_config.base_dir / spec.filename
        if not path.exists():
            missing.append((label, spec))

    if missing:
        if not download:
            names = ", ".join(f"{label} ({spec.filename})" for label, spec in missing)
            raise RuntimeError(f"Отсутствуют модели: {names}")
        with console.status("Скачиваем модели..."):
            for label, spec in missing:
                model_downloader.ensure(spec)
                console.print(f"[green]Скачан {label} — {spec.filename}[/green]")
    MODELS_READY = True


def run_query(query: str, files: List[Path]) -> AgentState:
    ensure_models()
    reset_llm_stats()
    state = initial_state(query, [str(path) for path in files])
    if files:
        doc_rows = _collect_file_metadata(state, files)
        if doc_rows:
            state["loaded_documents"] = doc_rows
            _print_documents_table(doc_rows)
    console.rule("[bold]Старт когнитивного цикла[/bold]")
    layout, live_callback = _build_live_view()
    agent_logger.subscribe(live_callback)
    try:
        with Live(layout, console=console, refresh_per_second=4, transient=True):
            result = _agent_graph().invoke(state)
    finally:
        agent_logger.reset_subscribers()
    result["llm_stats"] = get_llm_stats().to_dict()
    result["llm_backend"] = model_manager.backend_report()
    return result


@lru_cache(maxsize=1)
def _agent_graph():
    from agent.core.graph import agent_graph as graph

    return graph


@app.command(context_settings={"allow_extra_args": True})
def query(
    ctx: typer.Context,
    text: str = typer.Argument(..., help="Запрос пользователя"),
    files: List[Path] = typer.Option(
        [],
        "--files",
        "-f",
        help="Список файлов для контекста (можно перечислить несколько путей через пробел после опции)",
    ),
) -> None:
    """Одноразовый запуск агента."""

    extra_files = [Path(arg) for arg in ctx.args]
    all_files = list(files) + extra_files
    result = run_query(text, all_files)
    events = result.get("events", [])
    if events:
        _print_timeline(events)
        _print_call_tree(events)
        _print_tool_summary(result.get("tool_results", []), events)
    if llm_calls := result.get("llm_calls"):
        _print_llm_breakdown(llm_calls)
    if plan := result.get("plan"):
        console.print(Panel(json.dumps(plan, ensure_ascii=False, indent=2), title="План"))
    if tools := result.get("tool_results"):
        console.print(Panel(json.dumps(tools, ensure_ascii=False, indent=2), title="Ход выполнения"))
    if answer := result.get("final_answer"):
        console.print(Markdown(answer))
    if trace := result.get("langsmith_run_id"):
        console.print(f"[bold green]Trace:[/bold green] {trace}")
    _print_stats(result.get("llm_stats"), backend=result.get("llm_backend"))


@app.command()
def interactive() -> None:
    """Интерактивная сессия."""

    console.print("[bold]Интерактивный режим. Введите 'exit' для выхода.[/bold]")
    files: List[Path] = []
    while True:
        user = console.input("[bold blue]Вы[/bold blue]: ")
        if user.strip().lower() in {"exit", "quit"}:
            break
        if user.startswith("load "):
            _, _, path = user.partition(" ")
            file_path = Path(path.strip())
            if file_path.exists():
                files.append(file_path)
                console.print(f"[green]Добавлен файл {file_path}[/green]")
            else:
                console.print(f"[red]Файл {file_path} не найден[/red]")
            continue
        result = run_query(user, files)
        console.print(Markdown(result.get("final_answer", "нет ответа")))
        _print_stats(result.get("llm_stats"))


@app.command("index-documents")
def index_documents(
    directory: Path = typer.Argument(..., exists=True, file_okay=False, help="Путь к папке с договорами"),
) -> None:
    """Построение RAG индекса для юридических документов."""

    count = legal_rag_tool.index_documents(directory)
    console.print(f"[green]Загружено документов: {count}[/green]")


SLOT_LABELS = {"orchestrator": "Оркестратор", "executor": "Исполнитель"}


def _print_stats(stats: dict | None, *, backend: dict | None = None) -> None:
    if not stats:
        return

    table = Table("Показатель", "Значение")
    table.add_row("Вызовов LLM", str(stats.get("calls", 0)))
    table.add_row(
        "Токены (prompt / completion / total)",
        f"{stats.get('prompt_tokens', 0)} / {stats.get('completion_tokens', 0)} / {stats.get('total_tokens', 0)}",
    )
    table.add_row(
        "Время (prompt / eval, ms)",
        f"{stats.get('prompt_ms', 0.0)} / {stats.get('eval_ms', 0.0)}",
    )
    table.add_row("Скорость, ток/с", f"{stats.get('tokens_per_second', 0.0)}")
    console.print(Panel(table, title="LLM статистика"))
    if backend:
        _print_backend_info(backend)


def _print_backend_info(backend: dict) -> None:
    table = Table("Слот", "Режим")
    for slot, layers in backend.items():
        label = SLOT_LABELS.get(slot, slot)
        if layers is None or layers < 0:
            mode = "не загружен"
        elif layers > 0:
            mode = f"GPU ({layers} слоёв)"
        else:
            mode = "CPU"
        table.add_row(label, mode)
    console.print(Panel(table, title="LLM Backend"))


_TOKEN_ENCODER = None


def _ensure_token_encoder():
    global _TOKEN_ENCODER
    if _TOKEN_ENCODER is not None:
        return _TOKEN_ENCODER
    if tiktoken is None:
        return None
    try:
        _TOKEN_ENCODER = tiktoken.get_encoding("cl100k_base")
    except Exception:  # pragma: no cover - fallback path
        _TOKEN_ENCODER = None
    return _TOKEN_ENCODER


def _estimate_tokens(text: str) -> int:
    encoder = _ensure_token_encoder()
    if encoder is None:
        return max(1, len(text) // 4) if text else 0
    try:
        return len(encoder.encode(text))
    except Exception:  # pragma: no cover - encoding edge cases
        return max(1, len(text) // 4) if text else 0


def _collect_file_metadata(state: AgentState, files: List[Path]) -> List[dict]:
    rows: List[dict] = []
    for file_path in files:
        try:
            record = document_loader.load_file(file_path)
        except Exception as exc:
            console.print(f"[red]Не удалось прочитать {file_path}: {exc}[/red]")
            continue
        row = _build_document_row(file_path, record)
        rows.append(row)
        agent_logger.log_document_load(
            state,
            path=row["path"],
            metadata={
                "type": row["type"],
                "size_bytes": row["size_bytes"],
                "lines": row["lines"],
                "tokens": row["tokens"],
            },
        )
    return rows


def _build_document_row(path: Path, record: dict) -> dict:
    text = record.get("text", "") or ""
    metadata = record.get("metadata", {}) or {}
    size_bytes = path.stat().st_size if path.exists() else 0
    lines = text.count("\n") + 1 if text else 0
    doc_type = metadata.get("type") or path.suffix.lower().lstrip(".") or "unknown"
    return {
        "path": str(path),
        "type": doc_type,
        "size": _format_bytes(size_bytes),
        "size_bytes": size_bytes,
        "lines": lines,
        "tokens": _estimate_tokens(text),
    }


def _print_documents_table(rows: List[dict]) -> None:
    if not rows:
        return
    table = Table("Файл", "Тип", "Размер", "Строк", "~Токенов")
    for row in rows:
        table.add_row(
            row["path"],
            row["type"],
            row["size"],
            str(row["lines"]),
            str(row["tokens"]),
        )
    console.print(Panel(table, title="Загруженные файлы"))


def _format_bytes(size_bytes: int) -> str:
    units = ["Б", "КБ", "МБ", "ГБ"]
    value = float(size_bytes)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            if unit == "Б":
                return f"{int(value)} {unit}"
            return f"{value:.2f} {unit}"
        value /= 1024
    return f"{value:.2f} ГБ"


def _build_live_view() -> tuple[Layout, Callable[[AgentState, dict], None]]:
    layout = Layout()
    layout.split_column(
        Layout(name="current", size=7),
        Layout(name="history"),
    )
    layout["current"].update(Panel(Text("Ожидание событий..."), title="Текущий шаг"))
    layout["history"].update(Panel(Text("Запускаем граф..."), title="Прогресс"))

    def _on_event(state: AgentState, event: dict) -> None:
        layout["current"].update(Panel(_format_current_event(event), title="Текущий шаг"))
        layout["history"].update(Panel(_build_progress_tree(state.get("events", [])), title="Прогресс"))

    return layout, _on_event


def _format_current_event(event: dict | None) -> Text:
    if not event:
        return Text("Ожидание событий...")
    title, lines = _describe_event(event)
    txt = Text()
    txt.append(title + "\n", style="bold")
    for line in lines:
        txt.append(f"{line}\n", style="dim")
    return txt


def _build_progress_tree(events: List[dict]) -> Tree | Text:
    if not events:
        return Text("Событий пока нет.")
    tree = Tree("Последние шаги")
    for event in events[-12:]:
        title, lines = _describe_event(event)
        branch = tree.add(title)
        for line in lines[:3]:
            branch.add(line)
    return tree


def _format_event_label(event: dict) -> str:
    title, _ = _describe_event(event)
    return title


def _print_timeline(events: List[dict]) -> None:
    if not events:
        return
    start_ts = events[0].get("timestamp") or time.time()
    table = Table("#", "t+мс", "Нода", "Событие", "Детали")
    for idx, event in enumerate(events, start=1):
        delta = int(((event.get("timestamp") or start_ts) - start_ts) * 1000)
        details = event.get("details") or {}
        detail_text = ", ".join(f"{k}={v}" for k, v in list(details.items())[:3]) or "—"
        table.add_row(
            str(idx),
            f"+{delta}",
            event.get("node", "—"),
            event.get("event_type", "—"),
            detail_text,
        )
    console.print(Panel(table, title="Timeline"))


def _print_call_tree(events: List[dict]) -> None:
    if not events:
        return
    tree = Tree("Структура вызовов")
    grouped: OrderedDict[str, List[dict]] = OrderedDict()
    for event in events:
        grouped.setdefault(event.get("node", "unknown"), []).append(event)
    for node, node_events in grouped.items():
        branch = tree.add(_node_display_name(node))
        for event in node_events:
            title, lines = _describe_event(event)
            child = branch.add(title)
            for line in lines[:2]:
                child.add(line)
    console.print(Panel(tree, title="Call Tree"))


def _print_tool_summary(tool_results: List[dict], events: List[dict]) -> None:
    if not tool_results:
        return
    stats = defaultdict(lambda: {"calls": 0, "errors": 0, "duration": 0.0})
    for row in tool_results:
        tool = row.get("tool", "unknown")
        stats[tool]["calls"] += 1
        if not row.get("success", True):
            stats[tool]["errors"] += 1
    for event in events:
        if event.get("event_type") == "tool_call":
            details = event.get("details") or {}
            tool = details.get("tool", "unknown")
            stats[tool]["duration"] += float(details.get("duration_ms", 0.0))
    table = Table("Инструмент", "Вызовов", "Ошибок", "Σ время, мс")
    for tool, data in stats.items():
        table.add_row(
            tool,
            str(data["calls"]),
            str(data["errors"]),
            f"{data['duration']:.1f}",
        )
    console.print(Panel(table, title="Инструменты"))


def _print_llm_breakdown(llm_calls: List[dict]) -> None:
    if not llm_calls:
        return
    stats = defaultdict(lambda: {"calls": 0, "prompt": 0, "completion": 0, "total": 0, "duration": 0.0})
    for call in llm_calls:
        slot = call.get("slot", "orchestrator")
        stats[slot]["calls"] += 1
        stats[slot]["prompt"] += int(call.get("prompt_tokens", 0))
        stats[slot]["completion"] += int(call.get("completion_tokens", 0))
        stats[slot]["total"] += int(call.get("total_tokens", 0))
        stats[slot]["duration"] += float(call.get("duration_ms", 0.0))
    table = Table("Слот", "Вызовов", "Prompt/Completion", "Всего токенов", "Σ время, мс")
    for slot, data in stats.items():
        table.add_row(
            slot,
            str(data["calls"]),
            f"{data['prompt']} / {data['completion']}",
            str(data["total"]),
            f"{data['duration']:.1f}",
        )
    console.print(Panel(table, title="LLM Breakdown"))


def _describe_event(event: dict) -> tuple[str, list[str]]:
    node = event.get("node", "unknown")
    event_type = event.get("event_type", "")
    details = event.get("details") or {}
    lines: list[str] = []
    node_label = _node_display_name(node)

    if event_type == "node_enter":
        title = f"{node_label} → старт"
    elif event_type == "node_exit":
        duration = details.get("duration_ms")
        human = f"{duration:.0f} мс" if duration is not None else "—"
        title = f"{node_label} → финиш"
        lines.append(f"Длительность: {human}")
    elif event_type == "tool_call":
        tool = details.get("tool", "tool")
        success = details.get("success", True)
        icon = "✅" if success else "⚠️"
        duration = details.get("duration_ms")
        title = f"{icon} Инструмент: {tool}"
        if duration is not None:
            lines.append(f"Время: {duration:.0f} мс")
        if error := details.get("error"):
            lines.append(f"Ошибка: {error}")
    elif event_type == "document_load":
        path = Path(details.get("path", ""))
        title = f"📄 Загрузка: {path.name or path}"
        doc_type = details.get("type")
        if doc_type:
            lines.append(f"Тип: {doc_type}")
        size = details.get("size_bytes")
        if size:
            lines.append(f"Размер: {_format_bytes(int(size))}")
    elif event_type == "llm_call":
        slot = details.get("slot", "orchestrator")
        title = f"🧩 LLM: {slot}"
        lines.append(f"Токены: {details.get('total_tokens', 0)}")
        lines.append(f"Время: {details.get('duration_ms', 0):.0f} мс")
    elif event_type == "llm_call_pending":
        slot = details.get("slot", "orchestrator")
        title = f"🧩 LLM (подготовка): {slot}"
        preview = details.get("prompt_preview")
        if preview:
            lines.append("Промпт: " + preview[:80].replace("\n", " "))
        lines.append("Модель загружается / генерируем ответ...")
    else:
        title = f"{node_label} • {event_type}"
        for key, value in list(details.items())[:3]:
            lines.append(f"{key}: {value}")

    return title, lines


def _node_display_name(node: str) -> str:
    label = NODE_LABELS.get(node, node.capitalize())
    icon = NODE_ICONS.get(node, "•")
    return f"{icon} {label}"


def _status_table() -> Table:
    table = Table("Роль", "Файл", "Размер", "Статус")
    for _, label, spec in MODEL_TARGETS:
        path = llama_config.base_dir / spec.filename
        exists = path.exists()
        size = f"{path.stat().st_size / (1024**3):.2f} ГБ" if exists else "—"
        status = "[green]✅[/green]" if exists else "[red]нет[/red]"
        table.add_row(label, spec.filename, size, status)
    return table


@models_app.command("status")
def models_status() -> None:
    """Показать состояние локального кэша моделей."""

    console.print(_status_table())


def _resolve_target(role: str) -> tuple[str, ModelSpec]:
    for key, label, spec in MODEL_TARGETS:
        if key == role:
            return label, spec
    raise typer.BadParameter("role должен быть orchestrator или executor")


@models_app.command("download")
def models_download(
    role: Optional[str] = typer.Option(
        None, "--role", "-r", help="orchestrator | executor (по умолчанию скачиваются обе модели)"
    ),
) -> None:
    """Скачать нужные GGUF-модели заранее."""

    targets = []
    if role:
        targets.append(_resolve_target(role))
    else:
        targets = [(label, spec) for _, label, spec in MODEL_TARGETS]

    console.print("[cyan]Скачиваем модели (это может занять несколько минут)...[/cyan]")
    for label, spec in targets:
        path = model_downloader.ensure(spec)
        size = f"{path.stat().st_size / (1024**3):.2f} ГБ"
        console.print(f"[green]{label} готова ({path.name}, {size})[/green]")



def main() -> None:
    app()


if __name__ == "__main__":
    main()


