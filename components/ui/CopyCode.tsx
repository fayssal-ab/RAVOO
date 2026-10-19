"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Big referral-code chip: click copies the code. */
export function CopyCode({ code, size = "md" }: { code: string; size?: "md" | "lg" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch { /* clipboard blocked: the code is visible anyway */ }
      }}
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-neon/60 bg-neon/[0.06] font-mono font-bold text-neon transition hover:border-solid hover:bg-neon/10 hover:shadow-[0_0_30px_rgb(141_255_74/0.35)] ${
        size === "lg" ? "px-6 py-3.5 text-xl" : "px-4 py-2.5 text-base"
      }`}
      aria-label={`Copy code ${code}`}
    >
      <span className="font-pixel text-xs font-normal tracking-[0.2em] text-muted">CODE</span>
      <span className="tracking-[0.18em]">{code}</span>
      {copied ? <Check className="size-5" /> : <Copy className="size-5 opacity-60 transition group-hover:opacity-100" />}
      <span aria-live="polite" className="sr-only">{copied ? "Copied" : ""}</span>
    </button>
  );
}
