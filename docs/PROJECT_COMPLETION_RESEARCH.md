# Project Completion Research

Date: 2026-04-26

## Beginner Summary

This project can be completed in one full Research -> Plan -> Implement -> Test loop, but the loop is not tiny. Right now the repo has a small FastAPI backend skeleton, Supabase environment values, project docs, and no frontend yet.

The app should become three connected pieces:

- Supabase stores users, portfolios, and transactions.
- FastAPI protects portfolio APIs, calculates holdings, and fetches market data.
- Next.js gives the user a web app for login, portfolios, transactions, prices, and charts.

The simplest free path is to keep Supabase as the database/auth provider and use Yahoo Finance through `yfinance` for market data during MVP development. This is free and practical for a personal/development project, but it should be treated as best-effort delayed data, not guaranteed real-time exchange-grade data.

## What I Researched

### Repo State

- Root docs now exist: `CLAUDE.md`, `docs/PRD.md`, and `docs/ARCHITECTURE.md`.
- Active task tracking exists at `tasks/current_task.md`.
- Backend entrypoint currently exists at `backend/app/services/main.py`.
- `backend/app/main.py` does not currently exist.
- Backend folders exist for future code, but the app is not built yet.
- There is no `frontend/` directory yet.
- Node and npm are installed locally.
- Global `python` is not on PATH, but the backend virtual environment has Python 3.13.2.

### External Sources

- Supabase recommends Row Level Security for tables in exposed schemas like `public`, and policies should use `auth.uid()` to restrict rows to the signed-in user.
- Supabase's current Next.js guidance uses `@supabase/ssr` for server-side auth instead of older auth-helper packages.
- `yfinance` can fetch quote/search/history-style data from Yahoo Finance, but its docs clearly say it is not affiliated with Yahoo and is intended for research, educational, or personal use.

Useful references:

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Next.js Auth: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- yfinance docs: https://ranaroussi.github.io/yfinance/index.html
- yfinance PyPI: https://pypi.org/project/yfinance/

## Recommended Build Path

### 1. Fix the Database Foundation

Before building the UI, the Supabase schema should be tightened. The current tables are a good start, but several columns are nullable or default to random UUIDs where they should not.

Recommended changes:

- Make portfolio ownership reliable:
  - `portfolio.user_id` should be required.
  - New rows should use the authenticated user's ID, not a random UUID.
- Make transactions reliable:
  - `transactions.portfolio_id` should be required.
  - `transactions.user_id` should be required.
  - `transactions.ticker`, `type`, `shares`, and `price` should be required.
  - `type` should only allow `buy` or `sell`.
  - `shares` and `price` should be positive numbers.
- Add indexes:
  - `portfolio.user_id`
  - `transactions.user_id`
  - `transactions.portfolio_id`
  - `transactions.ticker`
- Enable RLS and policies:
  - Users can only select, insert, update, and delete their own portfolios.
  - Users can only select, insert, update, and delete their own transactions.

Teaching note: RLS means the database itself refuses rows that do not belong to the current user. This matters because it protects data even if a frontend or backend bug accidentally asks for too much.

### 2. Build the Backend API

FastAPI should expose a clean API that the frontend can call.

Recommended backend modules:

- `app/core/config.py`: environment variables.
- `app/core/security.py`: validate Supabase JWTs.
- `app/core/supabase.py`: create Supabase clients.
- `app/schemas/`: Pydantic request and response models.
- `app/api/routes/portfolios.py`: portfolio endpoints.
- `app/api/routes/transactions.py`: transaction endpoints.
- `app/api/routes/market_data.py`: ticker search, quote, and historical data endpoints.
- `app/services/portfolio_service.py`: holdings and portfolio value calculations.
- `app/services/market_data_service.py`: provider interface and yfinance implementation.

Recommended endpoints:

- `GET /health`
- `GET /api/portfolios`
- `POST /api/portfolios`
- `GET /api/portfolios/{portfolio_id}`
- `PATCH /api/portfolios/{portfolio_id}`
- `DELETE /api/portfolios/{portfolio_id}`
- `GET /api/portfolios/{portfolio_id}/transactions`
- `POST /api/portfolios/{portfolio_id}/transactions`
- `DELETE /api/transactions/{transaction_id}`
- `GET /api/market/search?q=AAPL`
- `GET /api/market/quote?ticker=AAPL`
- `GET /api/portfolios/{portfolio_id}/performance?range=1m`

Teaching note: schemas are the contract between frontend and backend. They keep the app from passing messy objects around and make errors easier to understand.

### 3. Build the Market Data Layer

Use `yfinance` for MVP, but hide it behind a provider interface.

The backend should normalize market data into simple shapes like:

- Quote:
  - `ticker`
  - `name`
  - `price`
  - `currency`
  - `market_time`
  - `data_delay_note`
- Historical point:
  - `date`
  - `close`

For charts, map app ranges to yfinance ranges:

- `1d`: intraday data.
- `5d`: intraday or daily data depending on availability.
- `1m`: daily data.
- `6m`: daily data.
- `1y`: daily data.
- `5y`: weekly or daily data.

Teaching note: the provider interface is an adapter. It lets the rest of the app ask for "quote for AAPL" without caring whether the data came from Yahoo, Alpha Vantage, Polygon, or something else later.

### 4. Build the Next.js Frontend

Recommended frontend location:

- `frontend/`

Recommended frontend stack:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Supabase Auth through `@supabase/ssr`.
- Recharts for portfolio charts.

Recommended pages:

- `/login`: sign in/sign up.
- `/portfolios`: portfolio list.
- `/portfolios/[id]`: portfolio dashboard.
- `/portfolios/[id]/transactions`: transaction history and add-transaction form.

Recommended dashboard sections:

- Portfolio value.
- Daily or selected-range gain/loss.
- Holdings table.
- Add transaction action.
- Performance chart with `1d`, `5d`, `1m`, `6m`, `1y`, `5y` controls.

Teaching note: the frontend should not talk directly to `yfinance`. The browser talks to FastAPI, and FastAPI talks to market data. That keeps secrets and provider-specific logic out of the UI.

### 5. Calculate Holdings and Performance

Holdings are derived from transactions:

- Buy adds shares.
- Sell subtracts shares.
- Current value equals current shares times current price.
- Cost basis comes from buy/sell history.

For MVP charts, calculate portfolio value over time by:

1. Getting historical prices for each ticker in the portfolio.
2. Reconstructing shares owned at each chart date from transaction history.
3. Multiplying shares owned by each ticker's historical close.
4. Summing all ticker values into one portfolio value point.

Teaching note: do not store current holdings as the source of truth at first. Transactions are the source of truth. Holdings are the result of adding up the transaction history.

### 6. Test the App

Backend tests should cover:

- Auth required for protected endpoints.
- Users cannot access another user's portfolio.
- Buy transactions increase holdings.
- Sell transactions decrease holdings.
- Overselling is rejected.
- Market-data failures return clear errors.
- Portfolio performance returns the selected range.

Frontend tests should cover:

- Login screen renders.
- Portfolio list loads.
- Create portfolio flow works.
- Add transaction flow validates required fields.
- Chart range controls call the right endpoint.

Manual end-to-end test:

1. Sign up or sign in.
2. Create a portfolio.
3. Add a buy transaction for `AAPL`.
4. Add a buy transaction for `MSFT`.
5. Confirm holdings and current values display.
6. Switch chart ranges.
7. Add a sell transaction.
8. Confirm holdings update.

## What I Need From You

Before implementation, please decide or provide:

- Whether the Next.js app should live in `frontend/` or at the repo root. I recommend `frontend/`.
- Which auth methods you want first. I recommend email/password only for MVP.
- Whether I can give you SQL migrations to run in Supabase for schema hardening and RLS policies.
- Whether you want only US stocks for MVP. I recommend US stocks only first.
- Whether the app is just for your personal use or eventually for other users. This changes how cautious we should be with `yfinance` and data-provider terms.

You do not need to get a paid market-data API key for the MVP. If we stay with `yfinance`, no API key is required.

## Important Risks

- `yfinance` is free and useful, but it is best-effort and intended for personal/research/educational use. It is not a guaranteed production market-data contract.
- The current Supabase schema should be hardened before app logic depends on it.
- The backend needs proper Supabase JWT validation before protected portfolio APIs are safe.
- Portfolio chart calculations can become slow if every request fetches fresh history for many tickers, so caching will matter after the MVP works.

## One-Loop Execution Plan

This project can be completed in one broad loop:

1. Research: confirm decisions, schema needs, and free market-data limits.
2. Plan: write exact API contracts, database migration SQL, and frontend routes.
3. Implement: build database policies, backend APIs, market-data adapter, and frontend UI.
4. Test: run backend tests, frontend checks, and a manual browser flow.

The loop is realistic if we keep MVP scope tight: one user account system, stocks only, manual transactions, delayed/free data, and no advanced analytics yet.
