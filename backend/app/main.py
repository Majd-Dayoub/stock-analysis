from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import market_data, portfolios, transactions
from app.core.config import FRONTEND_ORIGIN, SUPABASE_URL

app = FastAPI(title="Stock Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolios.router)
app.include_router(transactions.router)
app.include_router(market_data.router)


@app.get("/health")
def health():
    return {"status": "ok", "supabase_url_loaded": bool(SUPABASE_URL)}
