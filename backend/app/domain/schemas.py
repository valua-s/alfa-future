from __future__ import annotations

from datetime import date
from enum import StrEnum

from pydantic import BaseModel

month_names = {
        1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель",
        5: "Май", 6: "Июнь", 7: "Июль", 8: "Август",
        9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь"
    }


class AgentFunctions(StrEnum):
    FINANCE = "finance"
    CONTRAGENTS = "accountain"
    MARKETING = "marketing"
    LAWYER = "lawyer"


class TypeImportance(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class GrowthTrend(StrEnum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class FinancialHealthStatus(StrEnum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class OrganizationDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    id: int
    legal_name: str
    tax_id: str


class UserDataResponseDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }

    id: int
    first_name: str
    second_name: str
    patronymic: str | None = None
    hashed_password: str | None = None
    username: str
    organization: OrganizationDto | None = None

    @property
    def short_name(self) -> str:
        if self.patronymic:
            return f"{self.second_name} {self.first_name[0]}.{self.patronymic[0]}."
        return f"{self.second_name} {self.first_name[0]}."


class DCreateOrganizationDto(BaseModel):
    model_config = {"from_attributes": True}

    legal_name: str
    tax_id: str
    address: str


class Period(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    start_date: date
    end_date: date


class Recommendation(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    category: str
    priority: TypeImportance
    message: str
    suggested_action: str


class RecommendationsFromAssistant(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    summary: str
    recommendations: list[Recommendation]


class FinancialSummaryData(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    period: Period
    revenue: float
    expenses: float
    profit: float
    balance: float
    recommendations_from_assistant: RecommendationsFromAssistant


class FinancialSummaryResponse(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    data: FinancialSummaryData


class ProfitabilityMetrics(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    revenue: float
    expenses: float
    profit: float
    profit_margin_percent: float
    gross_margin_percent: float


class LiquidityMetrics(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    current_balance: float
    cash_burn_rate: float
    months_of_runway: float
    current_ratio: float


class EfficiencyMetrics(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    revenue_per_client: float
    customer_acquisition_cost: float
    marketing_roi: float


class GrowthMetrics(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    revenue_growth_percent: float
    client_growth_percent: float
    revenue_growth_trend: GrowthTrend


class FinancialHealth(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    score: float
    status: FinancialHealthStatus
    risk_level: TypeImportance


class KeyMetricsData(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    period: Period
    profitability_metrics: ProfitabilityMetrics
    liquidity_metrics: LiquidityMetrics
    efficiency_metrics: EfficiencyMetrics
    growth_metrics: GrowthMetrics
    financial_health: FinancialHealth
    key_insights: list[str]
    critical_warnings: list[str]


class KeyMetricsResponse(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    data: KeyMetricsData


class Downturn(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    id: int
    date: date
    category: str
    description: str
    deviation: float


class DownturnsResponse(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    data: list[Downturn]


class FullMessageData(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    question_text: str
    files: list[bytes] | None = None
    from_user_id: int
    from_service: AgentFunctions


class DeadlineResponse(BaseModel):
    date: date
    title: str
    type: str
    importance: str
    days_left: int


class CalendarResponse(BaseModel):
    current_month: str
    deadlines: list[DeadlineResponse]
