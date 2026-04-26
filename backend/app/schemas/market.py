from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ChartRange = Literal["1d", "5d", "1m", "6m", "1y", "5y"]


class TickerSearchResult(BaseModel):
    ticker: str
    name: str | None = None
    exchange: str | None = None
    type: str | None = None


class Quote(BaseModel):
    ticker: str
    name: str | None = None
    price: float
    currency: str | None = "USD"
    market_time: str | None = None
    data_delay_note: str = "Free Yahoo Finance data; delayed/best-effort for MVP."


class HistoricalPoint(BaseModel):
    date: str
    close: float


class PortfolioPerformancePoint(BaseModel):
    date: str
    value: float = Field(ge=0)
