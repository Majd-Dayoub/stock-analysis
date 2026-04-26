from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.market import ChartRange, HistoricalPoint, Quote, TickerSearchResult
from app.services.market_data_service import MarketDataService

router = APIRouter(prefix="/api/market", tags=["market"])
service = MarketDataService()


@router.get("/search", response_model=list[TickerSearchResult])
def search_tickers(q: str = Query(min_length=1, max_length=40)):
    try:
        return service.search(q)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ticker search failed: {exc}",
        ) from exc


@router.get("/quote", response_model=Quote)
def get_quote(ticker: str = Query(min_length=1, max_length=12)):
    try:
        return service.quote(ticker)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Quote lookup failed: {exc}",
        ) from exc


@router.get("/history", response_model=list[HistoricalPoint])
def get_history(
    ticker: str = Query(min_length=1, max_length=12),
    range: ChartRange = "1m",
):
    try:
        return service.history(ticker, range)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Historical price lookup failed: {exc}",
        ) from exc
