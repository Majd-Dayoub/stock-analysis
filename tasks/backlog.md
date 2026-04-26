# Backlog

## Next 10 Items

### 1. Verify Supabase Policies With Real Users

Create two test users and confirm each user can only see and edit their own portfolios and transactions.

Acceptance:

- User A cannot read, update, delete, or insert data for User B.
- Transaction insert fails if `portfolio_id` belongs to another user.

### 2. Add Backend Automated Tests

Add pytest coverage for portfolio logic, transaction logic, and auth-required endpoints.

Acceptance:

- Holdings math is tested for buy, sell, and oversell.
- Protected routes reject missing or invalid tokens.
- Backend test command is documented in `README.md`.

### 3. Improve Market Data Reliability

Add caching and better fallback behavior around quote, history, and search calls.

Acceptance:

- Repeated ticker requests avoid hammering Yahoo.
- Rate limits show friendly UI states.
- Chart still loads the rest of the dashboard when history fails.

### 4. Add Loading and Empty States Polish

Improve frontend states for empty portfolios, empty holdings, empty charts, failed quotes, and failed performance data.

Acceptance:

- No blank chart area without explanation.
- No raw JSON error text shown to the user.
- Empty holdings and transactions look intentional.

### 5. Add Edit and Delete Portfolio UI

Expose the existing backend update/delete capabilities in the frontend.

Acceptance:

- User can rename a portfolio.
- User can delete a portfolio after confirmation.
- Deleting a portfolio removes its transactions through cascade behavior.

### 6. Add Edit Transaction UI

Allow users to correct transaction mistakes without deleting and recreating rows.

Acceptance:

- Backend supports transaction update.
- Frontend supports edit flow.
- Oversell validation still applies after edits.

### 7. Fix Portfolio Performance Accuracy

Improve chart calculation so it reconstructs holdings at each date instead of using only final share totals.

Acceptance:

- Buys only affect chart dates after the buy date.
- Sells reduce holdings only after the sell date.
- Multiple tickers combine into one portfolio value series.

### 8. Add Cost Basis and Gain Details

Show realized/unrealized gains more clearly.

Acceptance:

- Holdings table includes cost basis, current value, and unrealized gain/loss.
- Portfolio summary includes total invested, current value, and gain/loss.
- Sell transactions reduce cost basis consistently.

### 9. Improve App Navigation and Layout

Make the MVP feel more complete as a small app.

Acceptance:

- Add consistent header/navigation.
- Add account/sign-out placement across screens.
- Improve mobile layout for dashboard tables and forms.

### 10. Prepare For Small Multi-User Beta

Make the project safer before sharing with up to five users.

Acceptance:

- Confirm `.env` files are ignored.
- Add setup steps for Supabase, backend, and frontend.
- Document known free market-data limitations.
- Run through a clean-machine setup checklist.
