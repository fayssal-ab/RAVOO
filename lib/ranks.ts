// Rank ladder: 40 levels in 8 tiers of 5. A viewer's level is the highest
// rank whose min_xp ≤ their lifetime xp. Thresholds live in the `ranks` table
// (editable in Admin → Ranks); this module only holds the tier styling and the
// pure lookup so client components can use it too.

export interface Rank {
  level: number;
  name: string;
  min_xp: number;
}

export interface Tier {
  name: string;
  from: number; // first level
  color: string; // css color
  glow: string;
}

export const TIERS: Tier[] = [
  { name: "Dreamer", from: 1, color: "#8b9a8f", glow: "rgba(139,154,143,.35)" },
  { name: "Restless", from: 6, color: "#b08d57", glow: "rgba(176,141,87,.4)" },
  { name: "Night Owl", from: 11, color: "#c0c7cf", glow: "rgba(192,199,207,.4)" },
  { name: "Insomniac", from: 16, color: "#e7c25a", glow: "rgba(231,194,90,.45)" },
  { name: "Midnight", from: 21, color: "#5ad7ff", glow: "rgba(90,215,255,.45)" },
  { name: "Nocturnal", from: 26, color: "#6f8bff", glow: "rgba(111,139,255,.5)" },
  { name: "Sleepless", from: 31, color: "#b07bff", glow: "rgba(176,123,255,.5)" },
  { name: "Never Sleeps", from: 36, color: "#7dff3a", glow: "rgba(125,255,58,.55)" },
];

export const MAX_LEVEL = 40;
const ROMAN = ["I", "II", "III", "IV", "V"];

export function tierFor(level: number): Tier {
  let t = TIERS[0];
  for (const tier of TIERS) if (level >= tier.from) t = tier;
  return t;
}

/** "Sleepless III" for level 33. */
export function defaultRankName(level: number): string {
  const t = tierFor(level);
  return `${t.name} ${ROMAN[(level - t.from) % 5]}`;
}

/** Default xp curve used by the seed: 0 at level 1, ~250k at level 40. */
export function defaultMinXp(level: number): number {
  if (level <= 1) return 0;
  return Math.round((100 * Math.pow(level - 1, 2.15)) / 10) * 10;
}

/** Highest rank reached for a given xp. `ranks` must be sorted by level. */
export function rankForXp(ranks: Rank[], xp: number): Rank {
  let current = ranks[0] ?? { level: 1, name: defaultRankName(1), min_xp: 0 };
  for (const r of ranks) if (xp >= r.min_xp) current = r;
  return current;
}

/** Progress toward the next level, 0..1 (1 at max level). */
export function rankProgress(ranks: Rank[], xp: number): { current: Rank; next: Rank | null; pct: number; need: number } {
  const current = rankForXp(ranks, xp);
  const next = ranks.find((r) => r.level === current.level + 1) ?? null;
  if (!next) return { current, next: null, pct: 1, need: 0 };
  const span = next.min_xp - current.min_xp;
  const pct = span > 0 ? Math.min(1, Math.max(0, (xp - current.min_xp) / span)) : 1;
  return { current, next, pct, need: Math.max(0, next.min_xp - xp) };
}
