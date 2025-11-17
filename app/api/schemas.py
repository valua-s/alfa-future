from __future__ import annotations

from datetime import date
from enum import StrEnum

from litestar.datastructures import UploadFile
from litestar.exceptions import ValidationException
from litestar.response import File
from pydantic import BaseModel, Field, SecretStr, field_validator

from app.domain.schemas import UserDataResponseDto


class TypeImportance(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Trend(StrEnum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class PostFormat(StrEnum):
    POST = "social_media_post"
    STORY = "story"


class ResponseFromBackDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }

    answer_text: str


class UserLoginDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }

    username: str
    password: SecretStr


class UserResponseDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }

    access_token: str
    token_type: str = "Bearer"
    user: UserDataResponseDto


class AccountMoney(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }

    count: float


class ProblemsDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    problems: list[str]


class DocumentDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    description: str
    document: UploadFile


class UserOrganizaitonDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    tax_id: str = Field(..., examples=["1234567890"])

    @field_validator("tax_id", mode="after")
    def check_tax_id(cls, v: str) -> str:
        if len(v) not in (10, 12) or not v.isdigit():
            raise ValidationException("Tax ID must be 10 or 12 digits")
        return v


class OrganizationInfo(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    organization_name: str
    tax_id: str


class IssueDetails(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    category: str
    problem: str
    recomendation: str


class IssuesList(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    marketing: list[IssueDetails]
    finance: list[IssueDetails]
    accounting: list[IssueDetails]
    legal: list[IssueDetails]


class TroublesOut(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    detected_issues: IssuesList


class DeadlineData(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    date: date
    title: str
    type: str
    importance: TypeImportance
    days_left: int


class CalendarOut(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    current_month: str
    deadlines: list[DeadlineData]


class SummaryDetails(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    title: str
    descrition: str
    trend: Trend
    impact: TypeImportance


class ResultsOut(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    analytics_date: date
    summary: list[SummaryDetails]
    recomendations: list[str]


class PeriodDatesRequest(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    start_date: date = Field(..., alias="startDate", examples=["2025-11-01"])
    end_date: date = Field(..., alias="endDate", examples=["2025-11-16"])


class FileDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    file: UploadFile


class CreatePostRequest(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    prompt: str
    format: PostFormat


class GenerateVisualDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    generation_id: str


class CheckContractResutlDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    current: File
    safe_version: File


class ChatMessageDto(BaseModel):
    model_config = {
        "from_attributes": True, "arbitrary_types_allowed": True
    }
    text_message: str | None = None
    files: list[UploadFile] | None = None
