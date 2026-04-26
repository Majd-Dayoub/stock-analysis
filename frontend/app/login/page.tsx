"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Lock, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. Check your email if confirmation is enabled.");
    }

    router.push("/portfolios");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-harbor text-white">
            <LineChart size={26} aria-hidden="true" />
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink md:text-6xl">
            Stock Analysis
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Track portfolios, record transactions, and see performance without paid market
            data during development.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded-md bg-ink/5 p-1">
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-medium ${
                mode === "signin" ? "bg-white text-ink shadow-sm" : "text-ink/60"
              }`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-medium ${
                mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink/60"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Email</span>
            <span className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3">
              <Mail size={18} className="text-ink/45" aria-hidden="true" />
              <input
                className="min-h-11 flex-1 border-0 bg-transparent outline-none"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Password</span>
            <span className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3">
              <Lock size={18} className="text-ink/45" aria-hidden="true" />
              <input
                className="min-h-11 flex-1 border-0 bg-transparent outline-none"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </span>
          </label>

          {message ? <p className="mb-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full rounded-md bg-harbor px-4 font-semibold text-white transition hover:bg-harbor/90"
          >
            {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
