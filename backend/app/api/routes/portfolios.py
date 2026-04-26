from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps.auth import CurrentUser, get_current_user
from app.schemas.market import ChartRange, PortfolioPerformancePoint
from app.schemas.portfolio import (
    Portfolio,
    PortfolioCreate,
    PortfolioSummary,
    PortfolioUpdate,
    Transaction,
    TransactionCreate,
)
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/portfolios", tags=["portfolios"])
service = PortfolioService()


@router.get("", response_model=list[Portfolio])
def list_portfolios(user: CurrentUser = Depends(get_current_user)):
    return user.db.get(
        "portfolio",
        {
            "select": "*",
            "user_id": f"eq.{user.id}",
            "order": "created_at.desc",
        },
    )


@router.post("", response_model=Portfolio, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    payload: PortfolioCreate,
    user: CurrentUser = Depends(get_current_user),
):
    rows = user.db.post("portfolio", {"name": payload.name, "user_id": user.id})
    return rows[0]


@router.get("/{portfolio_id}", response_model=PortfolioSummary)
def get_portfolio(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    portfolio = _load_portfolio(portfolio_id, user)
    transactions = _load_transactions(portfolio_id, user)
    return service.build_summary(portfolio, transactions)


@router.patch("/{portfolio_id}", response_model=Portfolio)
def update_portfolio(
    portfolio_id: str,
    payload: PortfolioUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    _load_portfolio(portfolio_id, user)
    rows = user.db.patch(
        "portfolio",
        {"id": f"eq.{portfolio_id}", "user_id": f"eq.{user.id}"},
        {"name": payload.name},
    )
    return rows[0]


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    _load_portfolio(portfolio_id, user)
    user.db.delete("portfolio", {"id": f"eq.{portfolio_id}", "user_id": f"eq.{user.id}"})
    return None


@router.get("/{portfolio_id}/transactions", response_model=list[Transaction])
def list_transactions(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    _load_portfolio(portfolio_id, user)
    return _load_transactions(portfolio_id, user)


@router.post(
    "/{portfolio_id}/transactions",
    response_model=Transaction,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    portfolio_id: str,
    payload: TransactionCreate,
    user: CurrentUser = Depends(get_current_user),
):
    _load_portfolio(portfolio_id, user)
    existing = _load_transactions(portfolio_id, user)
    candidate = Transaction(
        id="pending",
        portfolio_id=portfolio_id,
        user_id=user.id,
        ticker=payload.ticker.upper(),
        type=payload.type,
        shares=payload.shares,
        price=payload.price,
        created_at=None,
    )
    service.calculate_holdings(existing + [candidate])

    rows = user.db.post(
        "transactions",
        {
            "portfolio_id": portfolio_id,
            "user_id": user.id,
            "ticker": payload.ticker.upper(),
            "type": payload.type,
            "shares": str(payload.shares),
            "price": str(payload.price),
        },
    )
    return rows[0]


@router.get(
    "/{portfolio_id}/performance",
    response_model=list[PortfolioPerformancePoint],
)
def get_performance(
    portfolio_id: str,
    range: ChartRange = "1m",
    user: CurrentUser = Depends(get_current_user),
):
    _load_portfolio(portfolio_id, user)
    transactions = _load_transactions(portfolio_id, user)
    try:
        return service.performance(transactions, range)
    except HTTPException:
        raise
    except Exception:
        return []


def _load_portfolio(portfolio_id: str, user: CurrentUser) -> Portfolio:
    rows = user.db.get(
        "portfolio",
        {
            "select": "*",
            "id": f"eq.{portfolio_id}",
            "user_id": f"eq.{user.id}",
            "limit": "1",
        },
    )
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return Portfolio(**rows[0])


def _load_transactions(portfolio_id: str, user: CurrentUser) -> list[Transaction]:
    rows = user.db.get(
        "transactions",
        {
            "select": "*",
            "portfolio_id": f"eq.{portfolio_id}",
            "user_id": f"eq.{user.id}",
            "order": "created_at.asc",
        },
    )
    return [Transaction(**row) for row in rows]
