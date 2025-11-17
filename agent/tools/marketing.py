from __future__ import annotations

from dataclasses import dataclass

from langchain_core.messages import HumanMessage, SystemMessage

from agent.core.llm import invoke_orchestrator
from agent.core.state import AgentState


@dataclass(slots=True)
class PromotionBrief:
    goal: str
    audience: str
    budget: float | None = None
    duration_days: int | None = None


class MarketingTool:

    name = "marketing_generator"
    description = "Создание маркетинговых акций, слоганов, постов и расчет ROI."

    def generate_promotion(self, brief: PromotionBrief, *, state: AgentState | None = None) -> str:
        prompt = (
            f"Цель: {brief.goal}\n"
            f"Аудитория: {brief.audience}\n"
            f"Бюджет: {brief.budget or 'не указан'}\n"
            f"Длительность: {brief.duration_days or 'по договоренности'} дней\n"
            "Сформируй конкретную promo-кампанию: название, механика, каналы, KPI."
        )
        return self._invoke(prompt, state=state)

    def create_social_post(
        self, topic: str, tone: str = "дружелюбный", *, state: AgentState | None = None
    ) -> str:
        prompt = (
            f"Напиши короткий пост для соцсетей на тему: {topic}. "
            f"Тональность: {tone}. Добавь CTA и эмодзи, но не более 3."
        )
        return self._invoke(prompt, state=state)

    def estimate_roi(
        self, expected_revenue: float, budget: float, *, state: AgentState | None = None
    ) -> str:
        roi = ((expected_revenue - budget) / budget) * 100 if budget else 0.0
        prompt = (
            "Оцени окупаемость акции кофейни. "
            f"Бюджет: {budget:.2f} ₽, ожидаемая выручка: {expected_revenue:.2f} ₽, "
            f"ожидаемый ROI: {roi:.1f}%.\n"
            "Сформулируй риски и рекомендации по оптимизации расходов."
        )
        return self._invoke(prompt, state=state)

    def _invoke(self, prompt: str, state: AgentState | None = None) -> str:
        result = invoke_orchestrator(
            [
                SystemMessage(
                    content=(
                        "Ты — маркетолог и копирайтер. Думай структурированно, "
                        "пиши по-русски, используй списки."
                    )
                ),
                HumanMessage(content=prompt),
            ],
            state=state,
            node="marketing_tool",
        )
        return result.content


marketing_tool = MarketingTool()


