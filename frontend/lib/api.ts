import type {
  Portfolio,
  PortfolioSummary,
  TickerSearchResult,
  Transaction,
  TransactionInput
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listPortfolios(token: string) {
  return request<Portfolio[]>("/api/portfolios", token);
}

export function createPortfolio(token: string, name: string) {
  return request<Portfolio>("/api/portfolios", token, {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function getPortfolio(token: string, id: string) {
  return request<PortfolioSummary>(`/api/portfolios/${id}`, token);
}

export function listTransactions(token: string, portfolioId: string) {
  return request<Transaction[]>(`/api/portfolios/${portfolioId}/transactions`, token);
}

export function createTransaction(token: string, portfolioId: string, payload: TransactionInput) {
  return request<Transaction>(`/api/portfolios/${portfolioId}/transactions`, token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteTransaction(token: string, transactionId: string) {
  return request<void>(`/api/transactions/${transactionId}`, token, {
    method: "DELETE"
  });
}

export function getPerformance(token: string, portfolioId: string, range: string) {
  return request<{ date: string; value: number }[]>(
    `/api/portfolios/${portfolioId}/performance?range=${range}`,
    token
  );
}

export async function getPerformanceSafe(token: string, portfolioId: string, range: string) {
  try {
    return await getPerformance(token, portfolioId, range);
  } catch {
    return [];
  }
}

export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
  const response = await fetch(`${API_URL}/api/market/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Ticker search failed");
  }
  return response.json() as Promise<TickerSearchResult[]>;
}
