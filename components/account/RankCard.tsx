"use client";

import { motion } from "motion/react";
import { Coins } from "lucide-react";
import { RankBadge } from "@/components/ui/RankBadge";
import { tierFor } from "@/lib/ranks";

// Viewer's balance + rank with an animated progress bar to the next level.
export function RankCard({
  name, points, xp, level, rankName, nextName, nextLevel, pct, need,
}: {
  name: string; points: number; xp: number; level: number; rankName: string;
  nextName: string | null; nextLevel: number | null; pct: number; need: number;
}) {
  const tier = tierFor(level);
  return (
    <div className="panel neon-frame is-on relative overflow-hidden p-6">
      <div className="absolute -right-16 -top-16 size-56 rounded-full blur-3xl" style={{ background: tier.glow }} />
      <div className="relative flex flex-wrap items-center gap-5">
        <RankBadge level={level} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-head text-lg font-bold">{name}</p>
          <p className="font-head text-sm font-semibold uppercase tracking-widest" style={{ color: tier.color }}>{rankName}</p>
        </div>
        <div className="text-right">
          <p className="font-head text-xs font-semibold uppercase tracking-[0.18em] text-muted">Points</p>
          <p className="flex items-center justify-end gap-1.5 font-mono text-3xl font-bold text-neon"><Coins className="size-6" />{points.toLocaleString("en-US")}</p>
        </div>
      </div>
      <div className="relative mt-6">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted">
          <span>{xp.toLocaleString("en-US")} XP</span>
          <span>{nextLevel ? <>{need.toLocaleString("en-US")} XP to <span style={{ color: tierFor(nextLevel).color }}>{nextName}</span></> : "Max rank reached"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-line bg-bg">
          <motion.div
            className="relative h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${tier.color}, var(--color-neon-bright))`, boxShadow: `0 0 16px ${tier.glow}` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, pct * 100)}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <span className="absolute inset-0 animate-shine bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.5)_50%,transparent_70%)] bg-[length:250%_100%]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
