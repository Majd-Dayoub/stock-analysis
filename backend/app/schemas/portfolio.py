from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class PortfolioUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class Portfolio(BaseModel):
    id: str
    user_id: str | None = None
    name: str | None = None
    created_at: datetime | None = None


class TransactionCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=12)
    type: Literal["buy", "sell"]
    shares: Decimal = Field(gt=0)
    price: Decimal = Field(gt=0)


class Transaction(BaseModel):
    id: str
    portfolio_id: str
    user_id: str | None = None
    ticker: str
    type: Literal["buy", "sell"]
    shares: Decimal
    price: Decimal
    created_at: datetime | None = None


class Holding(BaseModel):
    ticker: str
    shares: Decimal
    average_cost: Decimal
    current_price: Decimal | None = None
    market_value: Decimal | None = None
    total_cost: Decimal
    unrealized_gain: Decimal | None = None


class PortfolioSummary(BaseModel):
    portfolio: Portfolio
    holdings: list[Holding]
    total_value: Decimal
    total_cost: Decimal
    unrealized_gain: Decimal
