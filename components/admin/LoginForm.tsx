"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Wrong username or password.",
  rate_limited: "Too many attempts. Wait a few minutes.",
};

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const data = new FormData(e.currentTarget);
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
        }).catch(() => null);
        if (res?.ok) {
          router.replace("/admin");
          router.refresh();
          return;
        }
        const body = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : {};
        setError(MESSAGES[body.error ?? ""] ?? "Login failed.");
        setBusy(false);
      }}
    >
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button className="btn btn-neon w-full" disabled={busy}>{busy ? "Checking…" : "Enter"}</button>
    </form>
  );
}
