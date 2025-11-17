from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate


synthesizer_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Ты — главный аналитик. Используй результаты всех инструментов, чтобы "
                "сформировать единый ответ для предпринимателя малого бизнеса. "
                "Структура ответа: 1) Резюме, 2) Ключевые наблюдения, 3) Рекомендации, "
                "4) Следующие шаги. Пиши по-русски, четко и с цифрами, если доступны."
            ),
        ),
        (
            "human",
            (
                "Запрос: {query}\n"
                "План: {plan}\n"
                "Результаты инструментов: {tool_results}\n"
                "Рефлексия: {reflection}\n"
                "Собери всё это в финальный отчет."
            ),
        ),
    ]
)


