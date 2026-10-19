import { Coins, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { SpotlightCard } from "@/components/ui/motion";
import { RankBadge } from "@/components/ui/RankBadge";
import { tierFor } from "@/lib/ranks";

export interface ItemView {
  id: number;
  name: string;
  description: string;
  kind: "cash" | "bonus" | "merch" | "other";
  price: number;
  min_rank: number;
  rank_name: string;
  stock: number | null;
}

/** Store art by item type; the top reward (rank 40) gets the vault. */
function artFor(item: ItemView): string {
  if (item.min_rank >= 40) return "/media/store/vault.webp";
  if (item.kind === "bonus") return "/media/store/bonus.webp";
  if (item.kind === "merch") return "/media/store/merch.webp";
  return "/media/store/cash.webp";
}

/** Store item card. `locked` greys it out behind the rank requirement. */
export function ItemCard({ item, locked, action }: { item: ItemView; locked: boolean; action?: ReactNode }) {
  const tier = tierFor(item.min_rank);
  return (
    <SpotlightCard className={`panel neon-frame group flex h-full flex-col overflow-hidden ${locked ? "" : "hover:border-line-hot"}`}>
      {/* product art, tinted toward the tier colour */}
      <div className="relative h-40 overflow-hidden border-b border-line bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artFor(item)}
          alt=""
          loading="lazy"
          draggable={false}
          className={`size-full object-cover transition duration-700 group-hover:scale-110 ${locked ? "opacity-50 grayscale" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 mix-blend-color opacity-50" style={{ background: `linear-gradient(0deg, ${tier.color}, transparent)` }} />
        <div className="absolute left-3 top-3"><RankBadge level={item.min_rank} compact /></div>
        {item.stock != null && (
          <span className="chip absolute right-3 top-3 !py-0.5 text-[0.7rem]">{item.stock > 0 ? `${item.stock} left` : "Sold out"}</span>
        )}
        {locked && (
          <div className="absolute inset-0 grid place-items-center bg-bg/55 backdrop-blur-[2px]">
            <span className="flex items-center gap-2 rounded-full border border-line-hot bg-bg/90 px-3 py-1.5 font-head text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>
              <Lock className="size-3.5" /> Rank {item.min_rank}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-head text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: tier.color }}>{item.rank_name}</p>
        <h3 className="mt-1 font-head text-xl font-bold leading-tight">{item.name}</h3>
        {item.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="flex items-center gap-1.5 font-mono text-2xl font-bold text-neon">
            <Coins className="size-5" />
            {item.price.toLocaleString("en-US")}
          </span>
          {action}
        </div>
      </div>
    </SpotlightCard>
  );
}
