from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MockBalance:
    balance: float
    last_nums: str


@dataclass
class MockAccountBalance:
    balance: float
    last_nums: str
    name: str


@dataclass
class FinancialSummary:
    revenue: float
    expenses: float
    profit: float


main_account_mock: MockBalance = MockBalance(balance=5678.02, last_nums="5567")
other_accounts_mock: MockAccountBalance = MockAccountBalance(balance=5678.02, last_nums="5567", name="Налоговая копилка")
financial_summary: FinancialSummary = FinancialSummary(revenue=1500000.00, expenses=950000.00, profit=550000.00)
