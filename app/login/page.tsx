"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const { pref: themePref, cycle: cycleTheme } = useTheme();
  const router = useRouter();

  const [tab,      setTab]      = useState<Tab>("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const reset = (t: Tab) => { setTab(t); setError(""); setPassword(""); setConfirm(""); };

  /* ── Sign in ── */
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  /* ── Sign up ── */
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setLoading(true);

    const reg = await fetch("/api/users/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim(), password }),
    });
    const data = await reg.json();

    if (!reg.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed.");
      return;
    }

    // Auto sign-in after registration
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Account created — please sign in.");
      setTab("signin");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle pref={themePref} onCycle={cycleTheme} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                          bg-accent-surface mb-4">
            <span className="text-accent text-lg">⊕</span>
          </div>
          <h1 className="text-lg font-semibold text-text">Macro Tracker</h1>
          <p className="text-sm text-text-muted mt-1">Track your daily nutrition</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6
                        shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-bg rounded-xl p-1">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => reset(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${tab === t
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted hover:text-text"}`}
              >
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
                className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-text-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                className="border border-border rounded-[10px] px-3 py-2.5 text-sm bg-bg text-text
                           placeholder-text-muted focus:outline-none focus:border-accent
                           focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-text-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="border border-border rounded-[10px] px-3 py-2.5 text-sm bg-bg text-text
                           placeholder-text-muted focus:outline-none focus:border-accent
                           focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>

            {/* Confirm password (sign up only) */}
            {tab === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs font-medium text-text-2">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border border-border rounded-[10px] px-3 py-2.5 text-sm bg-bg text-text
                             placeholder-text-muted focus:outline-none focus:border-accent
                             focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-accent text-white text-sm font-medium rounded-[10px]
                         hover:bg-accent-hover disabled:opacity-50 transition-colors focus-accent"
            >
              {loading
                ? (tab === "signin" ? "Signing in…" : "Creating account…")
                : (tab === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
