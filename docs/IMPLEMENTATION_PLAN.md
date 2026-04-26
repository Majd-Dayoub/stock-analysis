# MVP Implementation Plan

Date: 2026-04-26

## Locked Decisions

- Frontend location: `frontend/`.
- Auth for MVP: email/password only.
- Market scope: US stocks only.
- Expected early usage: small group, likely fewer than 5 users at a time.
- Market data: free `yfinance` integration for MVP, treated as delayed/best-effort data.
- Supabase SQL hardening: track in `tasks/backlog.md` for now instead of applying immediately.

## Goal

Build the first usable version of the stock portfolio tracker:

- User can sign up and sign in.
- User can create portfolios.
- User can add buy and sell transactions.
- User can search US stock tickers.
- User can see holdings, current values, and basic portfolio performance charts.

## Implementation Steps

### 1. Backend Foundation

Move the FastAPI app toward a standard structure while preserving the current health endpoint.

Planned backend work:

- Create a stable app entrypoint, preferably `backend/app/main.py`.
- Keep or redirect the current `backend/app/services/main.py` entrypoint so existing local habits do not break immediately.
- Add CORS settings so the future `frontend/` app can call the backend in development.
- Expand config handling for Supabase URL, publishable key, and backend-only secrets if needed later.

Teaching note: an entrypoint is the file the server starts from. Standardizing it early makes commands, docs, and deployment simpler.

### 2. Backend Auth and Data Access

Add authentication-aware backend helpers before protected APIs.

Planned backend work:

- Read the bearer token from frontend requests.
- Validate the user through Supabase.
- Make the authenticated user ID available to routes.
- Ensure every portfolio/transaction query is scoped to the current user.

Teaching note: even if Supabase has RLS later, the backend should still check ownership. That gives you two layers of protection instead of trusting one place.

### 3. Portfolio and Transaction APIs

Build the core application API.

Planned endpoints:

- `GET /health`
- `GET /api/portfolios`
- `POST /api/portfolios`
- `GET /api/portfolios/{portfolio_id}`
- `PATCH /api/portfolios/{portfolio_id}`
- `DELETE /api/portfolios/{portfolio_id}`
- `GET /api/portfolios/{portfolio_id}/transactions`
- `POST /api/portfolios/{portfolio_id}/transactions`
- `DELETE /api/transactions/{transaction_id}`

Rules:

- A buy transaction increases shares.
- A sell transaction decreases shares.
- Reject sell transactions that would make shares negative.
- Transactions are the source of truth; holdings are calculated from transactions.

### 4. Market Data Layer

Add a market data service that hides `yfinance` behind an internal interface.

Planned backend work:

- Add ticker search for US stocks.
- Add quote lookup for current or delayed price.
- Add historical price lookup for chart ranges.
- Normalize all provider responses before returning them to the frontend.

Initial chart ranges:

- `1d`
- `5d`
- `1m`
- `6m`
- `1y`
- `5y`

Teaching note: this is an adapter pattern. The app asks for market data in its own format, and only the adapter knows the details of `yfinance`.

### 5. Portfolio Performance

Calculate portfolio value history from transactions plus historical prices.

Planned backend work:

- Load all transactions for a portfolio.
- Find tickers currently or historically held.
- Fetch historical prices for those tickers.
- Reconstruct shares owned at each chart point.
- Return one portfolio value series to the frontend.

MVP simplification:

- Use historical close prices.
- Ignore dividends, splits, tax lots, and fees for now.

### 6. Frontend App

Create the Next.js app in `frontend/`.

Planned frontend work:

- Initialize Next.js with TypeScript and Tailwind.
- Add Supabase email/password auth with `@supabase/ssr`.
- Add API client helpers for FastAPI.
- Build login/sign-up flow.
- Build portfolio list.
- Build portfolio detail dashboard.
- Build add-transaction form.
- Build holdings table.
- Build portfolio chart with range controls.

Teaching note: the frontend should be the place where users interact with the app, but not the place where sensitive market-data or ownership logic lives.

### 7. Testing

Backend checks:

- Health endpoint works.
- Protected routes require auth.
- User-scoped portfolio access works.
- Buy/sell transaction math works.
- Overselling is rejected.
- Market-data errors return useful messages.

Frontend checks:

- Login/sign-up screens render.
- Portfolio creation flow works.
- Transaction form validates required fields.
- Dashboard loads holdings and chart data.
- Range controls call the expected backend endpoint.

Manual MVP test:

1. Sign up with email/password.
2. Create a portfolio.
3. Add a buy transaction for `AAPL`.
4. Add a buy transaction for `MSFT`.
5. Confirm holdings and value display.
6. Switch chart range to `1m`.
7. Add a sell transaction.
8. Confirm holdings update.

## Backlog Reference

Supabase SQL hardening and RLS are tracked in `tasks/backlog.md`. They should be completed before inviting other users, even if the first local prototype can start before them.
