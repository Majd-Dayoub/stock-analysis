"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Plus, WalletCards } from "lucide-react";

import { createPortfolio, listPortfolios } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { Portfolio } from "@/lib/types";

export default function PortfoliosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const sessionToken = data.session?.access_token;
      if (!sessionToken) {
        router.replace("/login");
        return;
      }

      setToken(sessionToken);
      try {
        setPortfolios(await listPortfolios(sessionToken));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load portfolios");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, supabase]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !token) return;

    const portfolio = await createPortfolio(token, name.trim());
    setPortfolios((current) => [portfolio, ...current]);
    setName("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">MVP Tracker</p>
          <h1 className="text-3xl font-semibold text-ink">Portfolios</h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </header>

      <section className="grid gap-5 md:grid-cols-[340px_1fr]">
        <form onSubmit={handleCreate} className="h-fit rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-moss text-white">
            <Plus size={22} aria-hidden="true" />
          </div>
          <h2 className="mb-4 text-lg font-semibold text-ink">Create portfolio</h2>
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Portfolio name</span>
            <input
              className="min-h-11 w-full rounded-md border border-ink/15 px-3 outline-none focus:border-harbor"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Long-term"
              required
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-harbor px-4 font-semibold text-white hover:bg-harbor/90"
          >
            <Plus size={18} aria-hidden="true" />
            Create
          </button>
        </form>

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <WalletCards size={22} className="text-harbor" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Your portfolios</h2>
          </div>

          {loading ? <p className="text-ink/60">Loading portfolios...</p> : null}
          {error ? <p className="rounded-md bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
          {!loading && portfolios.length === 0 ? (
            <p className="rounded-md bg-ink/5 p-4 text-ink/65">Create your first portfolio to begin.</p>
          ) : null}

          <div className="grid gap-3">
            {portfolios.map((portfolio) => (
              <Link
                href={`/portfolios/${portfolio.id}`}
                key={portfolio.id}
                className="flex min-h-16 items-center justify-between rounded-md border border-ink/10 px-4 transition hover:border-harbor/40 hover:bg-harbor/5"
              >
                <span>
                  <span className="block font-semibold text-ink">{portfolio.name ?? "Untitled"}</span>
                  <span className="text-sm text-ink/55">
                    {portfolio.created_at ? new Date(portfolio.created_at).toLocaleDateString() : "New"}
                  </span>
                </span>
                <ArrowRight size={19} className="text-harbor" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
