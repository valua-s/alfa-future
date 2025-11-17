from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String, unique=True)
    hashed_password: Mapped[str] = mapped_column(String)
    first_name: Mapped[str] = mapped_column(String)
    second_name: Mapped[str] = mapped_column(String)
    patronymic: Mapped[str | None] = mapped_column(String, nullable=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))

    organization = relationship("Organization", back_populates="users", lazy="selectin")


class Organization(Base):
    __tablename__ = "organizations"

    legal_name: Mapped[str] = mapped_column(String)
    tax_id: Mapped[str] = mapped_column(String(12), unique=True)
    address: Mapped[str] = mapped_column(String)

    users = relationship("User", back_populates="organization", lazy="selectin")


class TaxDeadline(Base):
    __tablename__ = "tax_deadlines"

    deadline_date: Mapped[date] = mapped_column(Date, nullable=True)
    title: Mapped[str] = mapped_column(String)
    report_type: Mapped[str] = mapped_column(String)
    importance: Mapped[str] = mapped_column(String)
    period_description: Mapped[str] = mapped_column(String)
    authority: Mapped[str] = mapped_column(String)
    report_year: Mapped[int] = mapped_column(Integer)

    def to_dict(self) -> dict[str, Any]:
        """Преобразование в словарь для API"""
        return {
            "date": self.deadline_date.isoformat(),
            "title": self.title,
            "type": self.report_type,
            "importance": self.importance,
            "days_left": (self.deadline_date - datetime.now().date()).days
        }
