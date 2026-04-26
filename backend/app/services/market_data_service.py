from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote_plus

import requests

from app.schemas.market import ChartRange, HistoricalPoint, Quote, TickerSearchResult

try:
    import yfinance as yf
except ImportError:  # pragma: no cover - only used before optional dependency install
    yf = None


class MarketDataService:
    _range_map: dict[ChartRange, tuple[str, str]] = {
        "1d": ("1d", "5m"),
        "5d": ("5d", "15m"),
        "1m": ("1mo", "1d"),
        "6m": ("6mo", "1d"),
        "1y": ("1y", "1d"),
        "5y": ("5y", "1wk"),
    }

    def search(self, query: str) -> list[TickerSearchResult]:
        cleaned = query.strip().upper()
        if not cleaned:
            return []

        url = (
            "https://query1.finance.yahoo.com/v1/finance/search"
            f"?q={quote_plus(cleaned)}&quotesCount=8&newsCount=0"
        )
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            quotes = response.json().get("quotes", [])
        except requests.RequestException:
            if cleaned.replace("-", "").isalnum() and len(cleaned) <= 12:
                return [TickerSearchResult(ticker=cleaned, name=None, exchange=None, type="EQUITY")]
            raise

        results: list[TickerSearchResult] = []
        for item in quotes:
            symbol = item.get("symbol")
            if not symbol or "." in symbol:
                continue
            exchange = item.get("exchange")
            if exchange and exchange.upper() not in {"NMS", "NYQ", "ASE", "PCX", "BATS"}:
                continue
            results.append(
                TickerSearchResult(
                    ticker=symbol.upper(),
                    name=item.get("shortname") or item.get("longname"),
                    exchange=exchange,
                    type=item.get("quoteType"),
                )
            )
        return results

    def quote(self, ticker: str) -> Quote:
        symbol = ticker.strip().upper()

        if yf is not None:
            ticker_obj = yf.Ticker(symbol)
            info = ticker_obj.fast_info
            price = self._coerce_float(
                getattr(info, "last_price", None)
                or getattr(info, "lastPrice", None)
                or info.get("last_price")
            )
            if price:
                return Quote(
                    ticker=symbol,
                    name=None,
                    price=price,
                    currency=getattr(info, "currency", None) or info.get("currency", "USD"),
                    market_time=datetime.now(timezone.utc).isoformat(),
                )

        url = (
            "https://query1.finance.yahoo.com/v7/finance/quote"
            f"?symbols={quote_plus(symbol)}"
        )
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        result = response.json().get("quoteResponse", {}).get("result", [])
        if not result:
            raise ValueError(f"No quote found for {symbol}")

        item = result[0]
        price = self._coerce_float(item.get("regularMarketPrice"))
        if price is None:
            raise ValueError(f"No market price found for {symbol}")

        return Quote(
            ticker=symbol,
            name=item.get("shortName") or item.get("longName"),
            price=price,
            currency=item.get("currency", "USD"),
            market_time=self._timestamp_to_iso(item.get("regularMarketTime")),
        )

    def history(self, ticker: str, chart_range: ChartRange) -> list[HistoricalPoint]:
        symbol = ticker.strip().upper()
        period, interval = self._range_map[chart_range]

        if yf is not None:
            frame = yf.Ticker(symbol).history(period=period, interval=interval)
            if not frame.empty:
                points: list[HistoricalPoint] = []
                for index, row in frame.iterrows():
                    close = self._coerce_float(row.get("Close"))
                    if close is not None:
                        points.append(HistoricalPoint(date=index.isoformat(), close=close))
                return points

        url = (
            "https://query1.finance.yahoo.com/v8/finance/chart/"
            f"{quote_plus(symbol)}?range={period}&interval={interval}"
        )
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        chart = response.json().get("chart", {})
        if chart.get("error"):
            raise ValueError(chart["error"].get("description", f"No history for {symbol}"))

        result = chart.get("result", [])
        if not result:
            return []

        timestamps = result[0].get("timestamp", [])
        closes = (
            result[0]
            .get("indicators", {})
            .get("quote", [{}])[0]
            .get("close", [])
        )
        points = []
        for timestamp, close in zip(timestamps, closes):
            price = self._coerce_float(close)
            if price is None:
                continue
            points.append(
                HistoricalPoint(
                    date=datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat(),
                    close=price,
                )
            )
        return points

    @staticmethod
    def _coerce_float(value: object) -> float | None:
        try:
            if value is None:
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _timestamp_to_iso(value: object) -> str | None:
        try:
            if value is None:
                return None
            return datetime.fromtimestamp(int(value), tz=timezone.utc).isoformat()
        except (TypeError, ValueError, OSError):
            return None
