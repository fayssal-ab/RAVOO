import type { Metadata } from "next";
import { Check, Lock } from "lucide-react";
import { RankCard } from "@/components/account/RankCard";
import { EmptyState, PageHeader } from "@/components/ui/bits";
import { Reveal } from "@/components/ui/motion";
import { RankBadge } from "@/components/ui/RankBadge";
import { getRanks, getViewer } from "@/lib/account";
import { rankProgress, TIERS } from "@/lib/ranks";
import { listStoreItems } from "@/lib/store";

export const metadata: Metadata = { title: "Ranks" };
export const dynamic = "force-dynamic";

export default async function RanksPage() {
  const [viewer, ranks, items] = await Promise.all([getViewer(), getRanks(), listStoreItems().catch(() => [])]);
  const prog = viewer ? rankProgress(ranks, viewer.xp) : null;
  const unlocks = new Map<number, string[]>();
  for (const it of items) unlocks.set(it.min_rank, [...(unlocks.get(it.min_rank) ?? []), it.name]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <PageHeader eyebrow="Rank ladder" title="40 levels." accent="No sleep.">
        Lifetime points (XP) move you up. Eight tiers, five levels each. The store opens up as you climb.
      </PageHeader>

      {viewer && prog && (
        <div className="mb-14">
          <RankCard
            name={viewer.display_name} points={viewer.points} xp={viewer.xp} level={prog.current.level} rankName={prog.current.name}
            nextName={prog.next?.name ?? null} nextLevel={prog.next?.level ?? null} pct={prog.pct} need={prog.need}
          />
        </div>
      )}

      {ranks.length === 0 ? (
        <EmptyState title="Ranks loading">The rank ladder is temporarily unavailable.</EmptyState>
      ) : (
        <div className="space-y-6">
          {[...TIERS].reverse().map((tier) => {
            const levels = ranks.filter((r) => r.level >= tier.from && r.level < tier.from + 5).reverse();
            const reached = viewer ? viewer.level >= tier.from : false;
            return (
              <Reveal key={tier.name}>
                <section className="panel relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1" style={{ background: tier.color, boxShadow: `0 0 24px ${tier.glow}` }} />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4" style={{ background: `linear-gradient(90deg, ${tier.glow.replace(/[\d.]+\)$/, "0.12)")}, transparent 60%)` }}>
                    <h2 className="font-display text-3xl" style={{ color: tier.color, textShadow: `0 0 18px ${tier.glow}` }}>{tier.name}</h2>
                    <span className="font-head text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Levels {tier.from}–{tier.from + 4} {reached && <Check className="ml-1 inline size-4 text-neon" />}
                    </span>
                  </div>
                  <ol className="divide-y divide-line/60">
                    {levels.map((r) => {
                      const mine = viewer?.level === r.level;
                      const done = viewer ? viewer.level >= r.level : false;
                      const items = unlocks.get(r.level);
                      return (
                        <li key={r.level} className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3.5 ${mine ? "bg-neon/[0.07]" : ""}`}>
                          <RankBadge level={r.level} compact />
                          <div className="min-w-0">
                            <p className="font-head font-bold">
                              {r.name}
                              {mine && <span className="chip ml-3 !py-0 text-[0.65rem] text-neon">You</span>}
                            </p>
                            {items && <p className="truncate text-xs text-muted">Unlocks: {items.join(" · ")}</p>}
                          </div>
                          <span className={`flex items-center gap-2 font-mono text-sm ${done ? "text-neon" : "text-dim"}`}>
                            {!done && viewer && <Lock className="size-3.5" />}
                            {r.min_xp.toLocaleString("en-US")} XP
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
