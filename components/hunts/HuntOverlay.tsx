"use client";

import { useEffect, useState } from "react";
import type { Hunt } from "@/lib/hunts";
import { SlotArt } from "@/components/ui/SlotArt";

const money = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// OBS overlay: compact hunt card (stats + the bonus list, next to open highlighted).
export function HuntOverlay() {
  const [hunt, setHunt] = useState<Hunt | null>(null);
  useEffect(() => {
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const loop = async () => {
      try {
        const res = await fetch("/api/hunt/state", { cache: "no-store" });
        const d = (await res.json()) as { ok: boolean; hunt: Hunt | null };
        if (d.ok && !stop) setHunt(d.hunt);
      } catch { /* keep the last state */ }
      if (!stop) t = setTimeout(loop, 3000);
    };
    loop();
    return () => { stop = true; clearTimeout(t); };
  }, []);
  if (!hunt) return null;
  const next = hunt.bonuses.find((b) => b.win == null);
  const s = hunt.stats;
  return (
    <div className="w-[440px] p-4">
      <div className="overflow-hidden rounded-3xl border-2 border-neon/40 bg-bg/90 shadow-[0_0_80px_-20px_rgb(141_255_74/0.6)] backdrop-blur-md">
        <div className="border-b border-line px-5 py-4">
          <p className="font-pixel text-xs uppercase tracking-[0.22em] text-neon">Bonus hunt</p>
          <p className="truncate font-display text-3xl"><span className="chrome">{hunt.title}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4">
          {[["Start", money(hunt.start_balance)], ["Won", money(s.won)], ["Opened", `${s.opened}/${s.count}`], [s.req_multi != null ? "Break-even" : "Avg multi", `${(s.req_multi ?? s.avg_multi ?? 0).toFixed(2)}x`]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-line bg-bg-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-dim">{l}</p>
              <p className="font-mono text-lg font-bold text-neon">{v}</p>
            </div>
          ))}
        </div>
        <ol className="max-h-[520px] space-y-1.5 overflow-hidden px-4 pb-4">
          {hunt.bonuses.map((b, i) => (
            <li key={b.id} className={`flex items-center gap-3 rounded-xl border p-1.5 ${next?.id === b.id ? "border-neon bg-neon/10" : "border-line bg-bg-2"} ${b.win == null && next?.id !== b.id ? "opacity-60" : ""}`}>
              <span className="w-5 text-center font-mono text-xs text-dim">{i + 1}</span>
              <SlotArt name={b.slot} src={b.image_url} size={36} rounded="rounded-md" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{b.slot}</span>
              <span className="font-mono text-xs text-dim">{money(b.bet)}</span>
              <span className={`w-16 text-right font-mono text-sm font-bold ${b.multi == null ? "text-dim" : b.multi >= 100 ? "text-gold" : "text-neon"}`}>{b.multi != null ? `${b.multi}x` : "…"}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
