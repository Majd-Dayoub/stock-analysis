from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException, status

from app.schemas.market import ChartRange, PortfolioPerformancePoint
from app.schemas.portfolio import Holding, Portfolio, PortfolioSummary, Transaction
from app.services.market_data_service import MarketDataService


class PortfolioService:
    def __init__(self, market_data: MarketDataService | None = None):
        self.market_data = market_data or MarketDataService()

    def build_summary(
        self,
        portfolio: Portfolio,
        transactions: list[Transaction],
    ) -> PortfolioSummary:
        holdings = self.calculate_holdings(transactions)
        total_value = sum((item.market_value or Decimal("0")) for item in holdings)
        total_cost = sum(item.total_cost for item in holdings)
        return PortfolioSummary(
            portfolio=portfolio,
            holdings=holdings,
            total_value=total_value,
            total_cost=total_cost,
            unrealized_gain=total_value - total_cost,
        )

    def calculate_holdings(self, transactions: list[Transaction]) -> list[Holding]:
        share_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
        cost_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

        for transaction in sorted(
            transactions,
            key=lambda item: item.created_at.isoformat() if item.created_at else "",
        ):
            ticker = transaction.ticker.upper()
            shares = Decimal(transaction.shares)
            price = Decimal(transaction.price)

            if transaction.type == "buy":
                share_totals[ticker] += shares
                cost_totals[ticker] += shares * price
                continue

            if shares > share_totals[ticker]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot sell {shares} shares of {ticker}; only {share_totals[ticker]} owned.",
                )

            average_cost = (
                cost_totals[ticker] / share_totals[ticker]
                if share_totals[ticker] > 0
                else Decimal("0")
            )
            share_totals[ticker] -= shares
            cost_totals[ticker] -= shares * average_cost

        holdings: list[Holding] = []
        for ticker, shares in sorted(share_totals.items()):
            if shares <= 0:
                continue

            total_cost = cost_totals[ticker]
            average_cost = total_cost / shares if shares > 0 else Decimal("0")
            current_price: Decimal | None = None
            market_value: Decimal | None = None

            try:
                quote = self.market_data.quote(ticker)
                current_price = Decimal(str(quote.price))
                market_value = current_price * shares
            except Exception:
                current_price = None
                market_value = None

            holdings.append(
                Holding(
                    ticker=ticker,
                    shares=shares,
                    average_cost=average_cost,
                    current_price=current_price,
                    market_value=market_value,
                    total_cost=total_cost,
                    unrealized_gain=(market_value - total_cost)
                    if market_value is not None
                    else None,
                )
            )

        return holdings

    def performance(
        self,
        transactions: list[Transaction],
        chart_range: ChartRange,
    ) -> list[PortfolioPerformancePoint]:
        held_tickers = sorted({transaction.ticker.upper() for transaction in transactions})
        if not held_tickers:
            return []

        history_by_ticker = {}
        for ticker in held_tickers:
            try:
                history_by_ticker[ticker] = self.market_data.history(ticker, chart_range)
            except Exception:
                history_by_ticker[ticker] = []
        date_keys = sorted({point.date for points in history_by_ticker.values() for point in points})
        if not date_keys:
            return []

        share_totals = self._final_share_totals(transactions)
        points: list[PortfolioPerformancePoint] = []
        for date_key in date_keys:
            value = 0.0
            for ticker, shares in share_totals.items():
                close = self._latest_close_at_or_before(history_by_ticker.get(ticker, []), date_key)
                if close is not None:
                    value += float(shares) * close
            points.append(PortfolioPerformancePoint(date=date_key, value=round(value, 2)))

        return points

    @staticmethod
    def _final_share_totals(transactions: list[Transaction]) -> dict[str, Decimal]:
        totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
        for transaction in transactions:
            ticker = transaction.ticker.upper()
            shares = Decimal(transaction.shares)
            totals[ticker] += shares if transaction.type == "buy" else -shares
        return {ticker: shares for ticker, shares in totals.items() if shares > 0}

    @staticmethod
    def _latest_close_at_or_before(points: list[HistoricalPoint], date_key: str) -> float | None:
        latest = None
        for point in points:
            if point.date <= date_key:
                latest = point.close
            else:
                break
        return latest
