from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List, Tuple

import numpy as np
import pandas as pd
from langchain_core.messages import HumanMessage, SystemMessage

from agent.core.llm import invoke_executor
from agent.core.state import AgentState


class FinancialTool:

    name = "financial_analyzer"
    description = (
        "Анализ финансовых таблиц: продажи, расходы, Cash Flow, рентабельность, "
        "поиск трендов и аномалий."
    )

    def analyze(self, files: Iterable[str], task: str, *, state: AgentState | None = None) -> str:
        report, _ = self.analyze_with_metadata(files, task, state=state)
        return report

    def analyze_with_metadata(
        self, files: Iterable[str], task: str, *, state: AgentState | None = None
    ) -> Tuple[str, List[dict]]:
        frames = [self._read_table(Path(path)) for path in files]
        if not frames:
            raise ValueError("Не переданы файлы для анализа")

        summary = [self._summarize_dataframe(df, path) for df, path in zip(frames, files)]
        prompt = self._build_prompt(summary, task)
        report = self._call_llm(prompt, state=state)
        return report, summary

    def _build_prompt(self, stats: List[dict], task: str) -> str:
        return (
            "Ты — финансовый аналитик малого бизнеса. Используй предоставленные "
            "агрегированные данные таблиц и выполни задачу.\n"
            f"Задача: {task}\n"
            f"Агрегаты данных (JSON): {json.dumps(stats, ensure_ascii=False, indent=2)}\n"
            "Сформируй понятный бизнес-отчет: ключевые метрики, выводы, рекомендации."
        )

    def _call_llm(self, prompt: str, state: AgentState | None = None) -> str:
        result = invoke_executor(
            [
                SystemMessage(
                    content=(
                        "Ты помогаешь предпринимателю понять финансовые показатели. "
                        "Отвечай кратко, структурированно и с цифрами."
                    )
                ),
                HumanMessage(content=prompt),
            ],
            state=state,
            node="financial_tool",
        )
        return result.content

    def _read_table(self, path: Path) -> pd.DataFrame:
        suffix = path.suffix.lower()
        if suffix == ".csv":
            return pd.read_csv(path)
        if suffix == ".tsv":
            return pd.read_csv(path, sep="\t")
        if suffix in {".xlsx", ".xls"}:
            return pd.read_excel(path)
        raise ValueError(f"Файл {path.name} не является табличным форматом")

    def _summarize_dataframe(self, df: pd.DataFrame, path: str) -> dict:
        numeric = df.select_dtypes(include=[np.number]).copy()
        summary = {"path": path, "row_count": len(df), "columns": list(df.columns), "stats": []}
        for column in numeric.columns:
            series = numeric[column].dropna()
            if series.empty:
                continue
            summary["stats"].append(
                {
                    "column": column,
                    "sum": float(series.sum()),
                    "mean": float(series.mean()),
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "std": float(series.std(ddof=0)),
                }
            )
        return summary


financial_tool = FinancialTool()


