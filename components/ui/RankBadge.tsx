import { tierFor } from "@/lib/ranks";

// Hexagon level badge tinted with the tier colour.
export function RankBadge({ level, name, compact = false }: { level: number; name?: string; compact?: boolean }) {
  const tier = tierFor(level);
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span
        className={`relative grid place-items-center font-mono font-bold ${compact ? "size-7 text-[11px]" : "size-10 text-sm"}`}
        style={{
          color: tier.color,
          filter: `drop-shadow(0 0 6px ${tier.glow})`,
        }}
        title={name ?? tier.name}
      >
        <svg viewBox="0 0 40 44" className="absolute inset-0 size-full" aria-hidden>
          <path d="M20 1.5 38 11.5v21L20 42.5 2 32.5v-21z" fill="rgb(4 6 5 / 0.85)" stroke="currentColor" strokeWidth="2" />
          <path d="M20 6 34 14v16L20 38 6 30V14z" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1" />
        </svg>
        <span className="relative">{level}</span>
      </span>
      {!compact && name && (
        <span className="font-head text-sm font-semibold uppercase tracking-wider" style={{ color: tier.color }}>
          {name}
        </span>
      )}
    </span>
  );
}
