# 0. All pages

#### GET /organization-info
Response
```
{
    organization_name: "ООО Альфа",
    tax_id: "1234567890"
}
```

# 1. Main page
#### GET main/main-account

Response:
```
{
  "balance": 5678.02,
  "last_nums": "5567"
}
```
#### GET main/other-account

Response:
```
{
  "balance": 1700.00,
  "last_nums": "5567",
  "name": "Налоговая копилка"
}
```
#### GET main/troubles
Response
```
{
  "detected_issues": {
    "marketing": [
      {
        "category": "Низкая эффективность рекламы",
        "problem": "80% рекламного бюджета тратится на каналы с низкой окупаемостью",
        "recommendation": "Перераспределить бюджет в пользу SEO и email-рассылок"
      },
      {
        "category": "Высокая стоимость привлечения",
        "problem": "CAC вырос на 40% за последний квартал",
        "recommendation": "Оптимизировать воронку продаж и запустить реферальную программу"
      }
    ],
    "finance": [
      {
        "category": "Кассовый разрыв",
        "problem": "В следующем месяце прогнозируется недостаток денежных средств",
        "recommendation": "Ускорить инкассацию дебиторки или получить кредитную линию"
      },
      {
        "category": "Низкая рентабельность",
        "problem": "Рентабельность упала ниже отраслевого норматива",
        "recommendation": "Снизить операционные расходы на 15%"
      }
    ],
    "accounting": [
      {
        "category": "Налоговые риски",
        "problem": "Выявлены расхождения в налоговой отчетности",
        "recommendation": "Срочно провести сверку с налоговой"
      },
      {
        "category": "Просроченная отчетность",
        "problem": "Задержка сдачи квартального отчета на 5 дней",
        "recommendation": "Автоматизировать процесс формирования отчетности"
      }
    ],
    "legal": [
      {
        "category": "Риск штрафов",
        "problem": "Истек срок действия лицензии на основной вид деятельности",
        "recommendation": "Подать заявление на продление лицензии в течение 3 дней"
      },
      {
        "category": "Юридические риски",
        "problem": "В договорах с клиентами отсутствуют важные пункты",
        "recommendation": "Обновить шаблоны договоров и провести аудит существующих"
      }
    ]
  }
}
```
#### GET main/calendar
Response
```
{
  "current_month": "Ноябрь 2025",
  "deadlines": [
    {
      "date": "2025-11-04",
      "title": "УСН за 9 месяцев 2025 года",
      "type": "налог",
      "importance": "high",
      "days_left": 2
    },
    {
      "date": "2025-11-15", 
      "title": "НДФЛ с отпускных и больничных за октябрь",
      "type": "отчетность",
      "importance": "medium",
      "days_left": 13
    },
    {
      "date": "2025-11-20",
      "title": "НДС за 3 квартал 2025 года",
      "type": "налог",
      "importance": "high",
      "days_left": 18
    },
    {
      "date": "2025-11-28",
      "title": "Страховые взносы за октябрь",
      "type": "взносы",
      "importance": "medium",
      "days_left": 26
    }
  ], 
}
```
#### GET main/results
Response
```
{
  "analytics_date": "2025-11-02",
  "summary": [
    {
      "title": "Рост выручки",
      "description": "Выручка выросла на 15% по сравнению с предыдущим кварталом, достигнув 2.5 млн руб.",
      "trend": "positive",
      "impact": "high"
    },
    {
      "title": "Увеличение операционных расходов", 
      "description": "Операционные расходы выроли на 22% из-за сезонного роста затрат на маркетинг",
      "trend": "negative",
      "impact": "medium"
    },
    {
      "title": "Рентабельность по клиентам",
      "description": "Топ-20% клиентов приносят 65% прибыли, выявлена концентрация рисков",
      "trend": "neutral", 
      "impact": "high"
    }
  ],
  "recommendations": [
    "Оптимизировать маркетинговый бюджет",
    "Диверсифицировать клиентскую базу",
    "Внедрить систему контроля расходов"
  ]
}
```

# 2. Finance
#### GET finance/financial-summary-bank

Response:

```
{
    "revenue": 1500000.00,
    "expenses": 950000.00,
    "profit": 550000.00,
}
```


#### POST /financial-summary
Request
```
{
    startDate (required) - YYYY-MM-DD
    endDate (required) - YYYY-MM-DD
}
```
Response
```
{
    "data": {
        "period": {
            "start_date": "2023-11-01",
            "end_date": "2023-11-30"
        },
        "revenue": 1500000.00,
        "expenses": 950000.00,
        "profit": 550000.00,
        "balance": 1200000.00
        "recomendations_from_assistaint": {
            "summary": "Хорошие финансовые показатели с рентабельностью 36.7%, но есть возможности для оптимизации",
            "recomendations": [
                {
                    "category": "Оптимизация расходов",
                    "priority": "medium",
                    "message": "Расходы составляют 63.3% от выручки. Рекомендуется провести детальный анализ статей расходов для выявления возможностей экономии.",
                    "suggested_action": "Проанализировать топ-3 статьи расходов и найти возможности сокращения на 5-10%"
                },
                {
                    "category": "Управление денежными средствами",
                    "priority": "low",
                    "message": "Прибыль составляет 550,000 руб. при балансе 1,200,000 руб. Рассмотрите варианты инвестирования свободных средств.",
                    "suggested_action": "Разместить часть средств на депозите или рассмотреть краткосрочные инвестиции"
                },
                {
                    "category": "Рост выручки",
                    "priority": "high",
                    "message": "Высокая маржинальность операций (36.7%) позволяет увеличивать инвестиции в развитие бизнеса.",
                    "suggested_action": "Увеличить бюджет на маркетинг на 15% для привлечения новых клиентов"
                }
            ],
        }
    }
}
```
#### POST /financial-summary/generate-pdf
Request
```
{
    startDate (required) - YYYY-MM-DD
    endDate (required) - YYYY-MM-DD
}
```
Response
```
Upload file
```

#### GET /key_metrics
Response
```
{
  "data": {
    "period": {
      "start_date": "2023-11-01",
      "end_date": "2023-11-30"
    },
    "profitability_metrics": {
      "revenue": 1500000.00,
      "expenses": 950000.00,
      "profit": 550000.00,
      "profit_margin_percent": 36.7,
      "gross_margin_percent": 45.2
    },
    "liquidity_metrics": {
      "current_balance": 1200000.00,
      "cash_burn_rate": 950000.00,
      "months_of_runway": 1.3,
      "current_ratio": 2.1
    },
    "efficiency_metrics": {
      "revenue_per_client": 10000.00,
      "customer_acquisition_cost": 13333.33,
      "marketing_roi": 3.5
    },
    "growth_metrics": {
      "revenue_growth_percent": 12.5,
      "client_growth_percent": 10.0,
      "revenue_growth_trend": "up"
    },
    "financial_health": {
      "score": 8.2,
      "status": "good",
      "risk_level": "low"
    },
    "key_insights": [
      "Высокая рентабельность позволяет увеличивать инвестиции в рост",
      "Запас денежных средств покрывает 1.3 месяца работы",
      "Темп роста выручки опережает рост клиентской базы"
    ],
    "critical_warnings": [
      "Стоимость привлечения клиента превышает средний чек",
      "Высокая доля расходов на зарплаты (42% от выручки)"
    ]
  }
}
```

#### GET /downturns
Response
```
{
    "data": [
        {
            "id": 1,
            "date": "2023-11-15",
            "category": "Выручка",
            "description": "Неожиданное падение продаж в регионе EMEA",
            "deviation": -0.25
        },
        {
            "id": 2,
            "date": "2023-11-20",
            "category": "Расходы",
            "description": "Превышение бюджета на закупку сырья",
            "deviation": 0.1
        }
    ]
}
```
# 3. Lawyer

# 4. Accountant
#### POST /accountant/check-contract
Request
```
    Upload file
```
Response
```
{
    current: Upload file,
    safe_version: Upload file
}
```

# 5. Marketing

#### POST /marketing/create_post
Request
```
{
    prompt: str,
    token: str,
    format: enum("social_media_post", "story")
}
```
Response
```
{
    generated_posts: [
        {
            id: str,
            text: str,
            type: str = post,
            hashtags: array[str]
        },
        {
            id: str,
            text: str,
            type: str = story,
            hashtags: array[str]
        },
        {
            id: str,
            text: str,
            type: str = mixed,
            hashtags: array[str]
        }
    ],
        generation_id: str
    }  
```
#### POST /marketing/generate visual
Request
```
{
    generation_id: str
}
```
Response
```
Upload File
```
#### GET /marketing/content-recomendations
Response
```
{
  "week": "2025-11-04 - 2025-11-10",
  "theme": "Финансовая эффективность бизнеса",
  "posts": [
    {
      "day": "monday",
      "date": "2025-11-04",
      "topic": "Как снизить операционные расходы без потери качества",
      "content_type": "экспертная статья",
      "key_points": [
        "Анализ структуры затрат",
        "Автоматизация рутинных процессов", 
        "Переговоры с поставщиками"
      ],
      "hashtags": ["#финансы", "#оптимизация", "#бизнес"]
    },
    {
      "day": "tuesday", 
      "date": "2025-11-05",
      "topic": "Кейс: рост рентабельности на 25% за квартал",
      "content_type": "кейс",
      "key_points": [
        "Реальные цифры и метрики",
        "Конкретные действия компании",
        "Результаты и выводы"
      ],
      "hashtags": ["#кейс", "#рентабельность", "#успех"]
    },
    {
      "day": "wednesday",
      "date": "2025-11-06", 
      "topic": "5 финансовых показателей, которые нужно отслеживать ежедневно",
      "content_type": "чек-лист",
      "key_points": [
        "Денежный поток",
        "Коэффициент текущей ликвидности",
        "Точка безубыточности"
      ],
      "hashtags": ["#аналитика", "#метрики", "#финменеджмент"]
    },
    {
      "day": "thursday",
      "date": "2025-11-07",
      "topic": "Интервью с финансовым директором",
      "content_type": "интервью",
      "key_points": [
        "Опыт управления бюджетом",
        "Советы по финансовому планированию", 
        "Ошибки и уроки"
      ],
      "hashtags": ["#интервью", "#финдир", "#опыт"]
    },
    {
      "day": "friday",
      "date": "2025-11-08",
      "topic": "Инструменты для финансового анализа",
      "content_type": "обзор",
      "key_points": [
        "Программы для учета",
        "Мобильные приложения", 
        "Онлайн-сервисы"
      ],
      "hashtags": ["#инструменты", "#софт", "#технологии"]
    },
    {
      "day": "saturday",
      "date": "2025-11-09",
      "topic": "Мифы о финансовом планировании",
      "content_type": "инфографика",
      "key_points": [
        "Разрушение популярных заблуждений",
        "Факты и исследования",
        "Практические советы"
      ],
      "hashtags": ["#мифы", "#инфографика", "#образование"]
    },
    {
      "day": "sunday", 
      "date": "2025-11-10",
      "topic": "Планируем бюджет на 2025 год",
      "content_type": "гайд",
      "key_points": [
        "Пошаговый алгоритм",
        "Шаблоны и формы",
        "Прогнозирование доходов и расходов"
      ],
      "hashtags": ["#бюджет", "#планирование", "#2025"]
    }
  ]
}
```