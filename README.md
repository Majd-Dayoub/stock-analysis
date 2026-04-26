# Stock Analysis

Website for tracking and analyzing stock portfolios.

## Local Development

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Local URLs:

- Frontend: http://localhost:3000
- Backend health: http://127.0.0.1:8000/health

## MVP Scope

- Email/password auth through Supabase.
- Portfolio creation.
- Buy/sell transactions.
- US stock ticker search.
- Current/delayed quote lookup.
- Holdings summary.
- Portfolio performance ranges: `1d`, `5d`, `1m`, `6m`, `1y`, `5y`.
