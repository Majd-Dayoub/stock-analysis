export type Portfolio = {
  id: string;
  user_id: string | null;
  name: string | null;
  created_at: string | null;
};

export type Holding = {
  ticker: string;
  shares: string;
  average_cost: string;
  current_price: string | null;
  market_value: string | null;
  total_cost: string;
  unrealized_gain: string | null;
};

export type PortfolioSummary = {
  portfolio: Portfolio;
  holdings: Holding[];
  total_value: string;
  total_cost: string;
  unrealized_gain: string;
};

export type Transaction = {
  id: string;
  portfolio_id: string;
  user_id: string | null;
  ticker: string;
  type: "buy" | "sell";
  shares: string;
  price: string;
  created_at: string | null;
};

export type TransactionInput = {
  ticker: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
};

export type TickerSearchResult = {
  ticker: string;
  name: string | null;
  exchange: string | null;
  type: string | null;
};
