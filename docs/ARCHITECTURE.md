# Architecture

## Stack

- Frontend: Next.js.
- Backend: FastAPI.
- Auth and database: Supabase.
- MVP market data: Yahoo Finance through `yfinance`, accepting free delayed or best-effort data.

The architecture should keep market data access replaceable so the project can switch providers later without rewriting portfolio logic.

## Current Backend State

The standard FastAPI entrypoint is:

- `backend/app/main.py`

The previous entrypoint remains as a compatibility shim:

- `backend/app/services/main.py`

The backend currently includes:

- Health endpoint.
- CORS for local frontend development.
- Supabase bearer-token user validation.
- Supabase REST helpers scoped by user token.
- Portfolio CRUD routes.
- Transaction create/list/delete routes.
- Holdings calculation from transactions.
- Market search, quote, and history routes.
- Portfolio performance route.

## Current Frontend State

The Next.js frontend lives in:

- `frontend/`

The frontend currently includes:

- Email/password sign-in and sign-up page.
- Portfolio list and create flow.
- Portfolio dashboard.
- Add buy/sell transaction form.
- US ticker search.
- Holdings table.
- Transaction table.
- Portfolio performance chart with `1d`, `5d`, `1m`, `6m`, `1y`, and `5y` controls.

## Supabase Schema

Current `portfolio` table:

```sql
create table public.portfolio (
  id uuid not null default gen_random_uuid (),
  user_id uuid null default gen_random_uuid (),
  name text null,
  created_at timestamp with time zone not null default now(),
  constraint portfolio_pkey primary key (id),
  constraint portfolio_user_id_fkey foreign KEY (user_id) references auth.users (id)
);
```

Current `transactions` table:

```sql
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  portfolio_id uuid null default gen_random_uuid (),
  ticker text null,
  type text null,
  shares numeric null,
  price numeric null,
  created_at timestamp with time zone not null default now(),
  user_id uuid null default gen_random_uuid (),
  constraint transactions_pkey primary key (id),
  constraint transactions_portfolio_id_fkey foreign KEY (portfolio_id) references portfolio (id) on delete CASCADE,
  constraint transactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
);
```

## Backend Responsibilities

The FastAPI backend owns:

- Portfolio CRUD.
- Transaction CRUD.
- Holdings calculation from transaction history.
- Market data lookup and normalization.
- Portfolio value history for chart ranges.
- Authenticated access checks using Supabase user identity.

## Frontend Responsibilities

The Next.js frontend owns:

- Auth screens and session handling.
- Portfolio list and portfolio detail views.
- Transaction entry flows.
- Ticker search UI.
- Current value, holdings, and chart display.
- Clear loading and error states for market data.

## Market Data Direction

Use Yahoo Finance through `yfinance` for MVP development because it is free and has broad ticker coverage. Treat this as best-effort delayed data, not guaranteed real-time exchange-grade data.

Market data is accessed through an internal provider boundary so another provider can replace `yfinance` later. The current service also has a Yahoo HTTP fallback for development resilience. Portfolio logic depends on normalized quote and historical price data, not on `yfinance` response shapes directly.

## Future Architecture Notes

- Cache market data where practical to reduce repeated requests.
- Keep paid-provider assumptions out of core product behavior.
- Revisit the database schema before production use, especially nullability, defaults for foreign keys, transaction type constraints, and row-level security policies.
