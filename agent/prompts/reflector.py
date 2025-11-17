from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate


reflector_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Ты — модуль рефлексии. Анализируй текущий прогресс выполнения плана "
                "и решай, нужно ли продолжать. Ответ должен быть JSON вида "
                "{{\"continue\": true|false, \"reason\": \"...\", \"next_steps\": []}}."
            ),
        ),
        (
            "human",
            (
                "Изначальный запрос: {query}\n"
                "Текущий шаг: {current_step}\n"
                "План: {plan}\n"
                "История инструментов: {tool_results}\n"
                "Есть ли достаточно данных для финального ответа? Если нет, предложи уточненные шаги."
            ),
        ),
    ]
)


