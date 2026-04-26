"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CircleDollarSign,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  createTransaction,
  deleteTransaction,
  getPerformanceSafe,
  getPortfolio,
  listTransactions,
  searchTickers
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioSummary, TickerSearchResult, Transaction } from "@/lib/types";

const ranges = ["1d", "5d", "1m", "6m", "1y", "5y"];

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value));
}

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [performance, setPerformance] = useState<{ date: string; value: number }[]>([]);
  const [range, setRange] = useState("1m");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tickerQuery, setTickerQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([]);
  const [form, setForm] = useState({
    ticker: "",
    type: "buy" as "buy" | "sell",
    shares: "",
    price: ""
  });

  const portfolioId = params.id;

  async function load(sessionToken = token, chartRange = range) {
    if (!sessionToken) return;
    setError("");
    const [summaryData, transactionData, performanceData] = await Promise.all([
      getPortfolio(sessionToken, portfolioId),
      listTransactions(sessionToken, portfolioId),
      getPerformanceSafe(sessionToken, portfolioId, chartRange)
    ]);
    setSummary(summaryData);
    setTransactions(transactionData);
    setPerformance(performanceData);
  }

  useEffect(() => {
    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      const sessionToken = data.session?.access_token;
      if (!sessionToken) {
        router.replace("/login");
        return;
      }

      setToken(sessionToken);
      try {
        await load(sessionToken, range);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load portfolio");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId, router, supabase]);

  useEffect(() => {
    async function runSearch() {
      if (tickerQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchResults(await searchTickers(tickerQuery));
      } catch {
        setSearchResults([]);
      }
    }

    const timer = window.setTimeout(runSearch, 300);
    return () => window.clearTimeout(timer);
  }, [tickerQuery]);

  async function changeRange(nextRange: string) {
    setRange(nextRange);
    if (!token) return;
    setPerformance(await getPerformanceSafe(token, portfolioId, nextRange));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await createTransaction(token, portfolioId, {
        ticker: form.ticker.toUpperCase(),
        type: form.type,
        shares: Number(form.shares),
        price: Number(form.price)
      });
      setForm({ ticker: "", type: "buy", shares: "", price: "" });
      setTickerQuery("");
      setSearchResults([]);
      await load(token, range);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save transaction");
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(id: string) {
    if (!token) return;
    await deleteTransaction(token, id);
    await load(token, range);
  }

  const gainTone = useMemo(() => {
    const gain = Number(summary?.unrealized_gain ?? 0);
    return gain >= 0 ? "text-moss" : "text-coral";
  }, [summary]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/portfolios" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-harbor">
            <ArrowLeft size={17} aria-hidden="true" />
            Portfolios
          </Link>
          <h1 className="text-3xl font-semibold text-ink">
            {summary?.portfolio.name ?? "Portfolio"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <RefreshCw size={17} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {error ? <p className="mb-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
      {loading ? <p className="rounded-md bg-white p-5 text-ink/60">Loading dashboard...</p> : null}

      {!loading && summary ? (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-3">
            <Metric title="Portfolio value" value={money(summary.total_value)} icon={<CircleDollarSign size={21} />} />
            <Metric title="Total cost" value={money(summary.total_cost)} icon={<BarChart3 size={21} />} />
            <Metric title="Unrealized gain" value={money(summary.unrealized_gain)} tone={gainTone} icon={<BarChart3 size={21} />} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Performance</h2>
                <div className="flex rounded-md bg-ink/5 p-1">
                  {ranges.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeRange(item)}
                      className={`min-h-9 rounded px-3 text-sm font-semibold ${
                        range === item ? "bg-white text-ink shadow-sm" : "text-ink/60"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={performance}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      formatter={(value) => money(Number(value))}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Line type="monotone" dataKey="value" stroke="#285a77" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Plus size={20} className="text-harbor" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-ink">Add transaction</h2>
              </div>

              <label className="mb-3 block">
                <span className="mb-2 block text-sm font-medium text-ink/70">Ticker</span>
                <span className="flex items-center gap-2 rounded-md border border-ink/15 px-3">
                  <Search size={17} className="text-ink/45" aria-hidden="true" />
                  <input
                    className="min-h-10 flex-1 border-0 bg-transparent uppercase outline-none"
                    value={form.ticker}
                    onChange={(event) => {
                      const next = event.target.value.toUpperCase();
                      setForm((current) => ({ ...current, ticker: next }));
                      setTickerQuery(next);
                    }}
                    required
                  />
                </span>
              </label>

              {searchResults.length > 0 ? (
                <div className="mb-3 grid gap-1">
                  {searchResults.slice(0, 4).map((result) => (
                    <button
                      key={result.ticker}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, ticker: result.ticker }));
                        setTickerQuery("");
                        setSearchResults([]);
                      }}
                      className="rounded-md bg-ink/5 px-3 py-2 text-left text-sm hover:bg-harbor/10"
                    >
                      <span className="font-semibold">{result.ticker}</span>
                      <span className="ml-2 text-ink/60">{result.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mb-3 grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-2 block text-sm font-medium text-ink/70">Type</span>
                  <select
                    className="min-h-10 w-full rounded-md border border-ink/15 px-3"
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, type: event.target.value as "buy" | "sell" }))
                    }
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-ink/70">Shares</span>
                  <input
                    className="min-h-10 w-full rounded-md border border-ink/15 px-3"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={form.shares}
                    onChange={(event) => setForm((current) => ({ ...current, shares: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-medium text-ink/70">Price</span>
                <input
                  className="min-h-10 w-full rounded-md border border-ink/15 px-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-harbor px-4 font-semibold text-white hover:bg-harbor/90"
              >
                <Plus size={18} aria-hidden="true" />
                {saving ? "Saving..." : "Add transaction"}
              </button>
            </form>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <DataTable title="Holdings">
              <thead>
                <tr>
                  <Th>Ticker</Th>
                  <Th>Shares</Th>
                  <Th>Avg cost</Th>
                  <Th>Value</Th>
                </tr>
              </thead>
              <tbody>
                {summary.holdings.map((holding) => (
                  <tr key={holding.ticker} className="border-t border-ink/10">
                    <Td>{holding.ticker}</Td>
                    <Td>{Number(holding.shares).toLocaleString()}</Td>
                    <Td>{money(holding.average_cost)}</Td>
                    <Td>{money(holding.market_value)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            <DataTable title="Transactions">
              <thead>
                <tr>
                  <Th>Ticker</Th>
                  <Th>Type</Th>
                  <Th>Shares</Th>
                  <Th>Price</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-ink/10">
                    <Td>{transaction.ticker}</Td>
                    <Td>{transaction.type}</Td>
                    <Td>{Number(transaction.shares).toLocaleString()}</Td>
                    <Td>{money(transaction.price)}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => removeTransaction(transaction.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-coral hover:bg-coral/10"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Metric({
  title,
  value,
  icon,
  tone = "text-ink"
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-harbor/10 text-harbor">
        {icon}
      </div>
      <p className="text-sm font-medium text-ink/60">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function DataTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 p-4">
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-semibold text-ink/65">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-ink/80">{children}</td>;
}
