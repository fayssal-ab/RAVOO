"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton({ endpoint = "/api/auth/user/logout", to = "/" }: { endpoint?: string; to?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(endpoint, { method: "POST" }).catch(() => {});
        window.location.href = to;
      }}
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
