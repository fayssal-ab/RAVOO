import type { Metadata } from "next";
import Link from "next/link";
import { Coins } from "lucide-react";
import { RankCard } from "@/components/account/RankCard";
import { SignInButtons } from "@/components/account/SignInPanel";
import { ItemCard } from "@/components/store/ItemCard";
import { EmptyState, Flash, PageHeader } from "@/components/ui/bits";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Stagger } from "@/components/ui/motion";
import { getRanks, getViewer } from "@/lib/account";
import { rankProgress } from "@/lib/ranks";
import { listRedemptions, listStoreItems } from "@/lib/store";
import { enabledProviders } from "@/lib/userAuth";
import { redeemAction } from "../actions";

export const metadata: Metadata = { title: "Store" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { pending: "text-gold", fulfilled: "text-neon", rejected: "text-danger" };

export default async function StorePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [viewer, ranks, items] = await Promise.all([getViewer(), getRanks(), listStoreItems().catch(() => null)]);
  const rankName = new Map(ranks.map((r) => [r.level, r.name]));
  const prog = viewer ? rankProgress(ranks, viewer.xp) : null;
  const mine = viewer ? await listRedemptions({ accountId: viewer.id, limit: 10 }).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <PageHeader eyebrow="Points store" title="Spend" accent="your points">
        Every item unlocks at a rank. Climb the ladder, then trade points for real rewards.
      </PageHeader>

      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} okText="Redeemed! The team will process it shortly. Track it below." />

      <div className="mb-12">
        {viewer && prog ? (
          <RankCard
            name={viewer.display_name} points={viewer.points} xp={viewer.xp} level={prog.current.level} rankName={prog.current.name}
            nextName={prog.next?.name ?? null} nextLevel={prog.next?.level ?? null} pct={prog.pct} need={prog.need}
          />
        ) : (
          <div className="panel flex flex-col items-center justify-between gap-5 p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-head text-xl font-bold">Sign in to see your points and rank</p>
              <p className="mt-1 text-sm text-muted">Your balance and unlocked items show up here.</p>
            </div>
            <SignInButtons providers={enabledProviders()} next="/store" />
          </div>
        )}
      </div>

      {items == null ? (
        <EmptyState title="Store offline">The store is temporarily unavailable. Try again in a minute.</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState title="Store restocking">New rewards land here soon.</EmptyState>
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" step={0.05}>
          {items.map((it) => {
            const locked = viewer ? viewer.level < it.min_rank : false;
            const soldOut = it.stock != null && it.stock <= 0;
            const short = viewer ? viewer.points < it.price : false;
            return (
              <ItemCard
                key={it.id}
                item={{ ...it, rank_name: rankName.get(it.min_rank) ?? `Rank ${it.min_rank}` }}
                locked={locked}
                action={
                  viewer ? (
                    <form action={redeemAction}>
                      <input type="hidden" name="item" value={it.id} />
                      <ConfirmButton
                        className="btn btn-neon btn-sm"
                        disabled={locked || soldOut || short}
                        title="Redeem?"
                        confirmLabel={`Spend ${it.price.toLocaleString("en-US")}`}
                        body={<><span className="font-bold text-text">{it.name}</span> for <span className="font-mono text-neon">{it.price.toLocaleString("en-US")}</span> points. Make sure your Qzino username is set on your <Link href="/account" className="text-neon underline">account</Link> so we know where to send it.</>}
                      >
                        {soldOut ? "Sold out" : locked ? "Locked" : short ? "Need more" : "Redeem"}
                      </ConfirmButton>
                    </form>
                  ) : null
                }
              />
            );
          })}
        </Stagger>
      )}

      {viewer && mine.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow mb-4">Your redemptions</p>
          <div className="panel divide-y divide-line">
            {mine.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-head font-bold">{r.item_name}</p>
                  <p className="text-xs text-dim">{r.created_at} UTC{r.admin_note && <> · {r.admin_note}</>}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-mono text-sm text-muted"><Coins className="size-4" />{r.price.toLocaleString("en-US")}</span>
                  <span className={`font-head text-xs font-bold uppercase tracking-widest ${STATUS[r.status]}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-dim">
        Ranks come from lifetime points (XP). Spending points never lowers your rank. <Link href="/ranks" className="text-neon hover:underline">See all 40 ranks →</Link>
      </p>
    </div>
  );
}
