"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { Bonus } from "@/lib/hunts";

const money = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Bonus list with a slot search; the top multi gets a TOP badge. */
export function HuntTable({ bonuses }: { bonuses: Bonus[] }) {
  const [q, setQ] = useState("");
  const top = bonuses.reduce<Bonus | null>((m, b) => (b.multi != null && (m == null || b.multi > (m.multi ?? 0)) ? b : m), null);
  const list = bonuses.filter((b) => !q || b.slot.toLowerCase().includes(q.toLowerCase()) || b.provider.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl"><span className="chrome">Bonuses</span></h2>
        <label className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search slots" className="field !rounded-full !pl-10" aria-label="Search slots" />
        </label>
      </div>
      {bonuses.length === 0 ? (
        <p className="panel p-6 text-sm text-muted">No bonuses collected yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-[2rem_1fr_5.5rem_4rem] gap-3 px-5 pb-2 sm:grid-cols-[2.5rem_1fr_5rem_6rem_4.5rem] font-head text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-dim">
            <span>#</span><span>Slot</span><span className="hidden text-right sm:block">Bet</span><span className="text-right">Win</span><span className="text-right">Multi</span>
          </div>
          <ol className="space-y-2">
            {list.map((b) => (
              <li key={b.id} className={`panel grid grid-cols-[2rem_1fr_5.5rem_4rem] items-center sm:grid-cols-[2.5rem_1fr_5rem_6rem_4.5rem] gap-3 px-5 py-3.5 transition hover:border-line-hot ${b.win == null ? "opacity-70" : ""}`}>
                <span className="font-mono font-bold text-dim">{bonuses.indexOf(b) + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 truncate font-head font-bold">
                    {b.slot}
                    {top?.id === b.id && <span className="rounded-full bg-gold px-2 py-0.5 font-head text-[0.6rem] font-bold uppercase text-bg">Top</span>}
                  </span>
                  <span className="block truncate text-xs text-dim">{b.provider}{b.called_by && ` · called by ${b.called_by}`}</span>
                </span>
                <span className="hidden text-right font-mono text-sm sm:block">{money(b.bet)}</span>
                <span className="text-right font-mono text-sm font-bold text-neon">{b.win != null ? money(b.win) : "—"}</span>
                <span className={`text-right font-mono text-sm font-bold ${b.multi == null ? "text-dim" : b.multi >= 100 ? "text-gold" : b.multi >= 20 ? "text-neon" : ""}`}>{b.multi != null ? `${b.multi}x` : "…"}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
