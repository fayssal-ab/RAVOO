import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReelNumber } from "@/components/fx/ReelNumber";
import { BoardExplorer, Podium } from "@/components/leaderboard/Board";
import { EmptyState } from "@/components/ui/bits";
import { CopyCode } from "@/components/ui/CopyCode";
import { Countdown, Reveal, Stagger } from "@/components/ui/motion";
import { QZINO_CODE, QZINO_URL } from "@/lib/constants";
import { getBoard } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const fmtDate = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthOf = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const RULES = [
  `Only wagers on Qzino made under code ${QZINO_CODE} count.`,
  "Your rank is your total wager during the period. On a tie, the wager recorded first ranks higher.",
  "Wagers are updated by the team during the period; the final board is checked before payouts.",
  "Usernames are partly hidden for privacy.",
  "Wager abuse (self-matching, bonus abuse, multi-accounting) means disqualification.",
  "Prizes are paid after the period ends. Contact the team on Discord if something looks wrong.",
];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const id = p && /^\d+$/.test(p) ? Number(p) : undefined;
  const board = await getBoard(id).catch(() => null);
  const period = board?.period ?? null;
  const rows = (board?.rows ?? []).map((r) => ({ ...r, wagered: Number(r.wagered), prize: r.prize != null ? Number(r.prize) : null }));
  const prizes = Object.fromEntries((board?.prizes ?? []).map((x) => [x.place, Number(x.amount)]));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {board == null ? (
        <EmptyState title="Leaderboard offline">The leaderboard is temporarily unavailable. Try again in a minute.</EmptyState>
      ) : !period ? (
        <>
          <header className="pb-10 pt-6 text-center">
            <h1 className="font-display text-6xl sm:text-8xl"><span className="chrome">Monthly</span> <span className="neon-text">leaderboard</span></h1>
          </header>
          <EmptyState
            title="No leaderboard yet"
            action={<a href={QZINO_URL} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-neon">Join Qzino · code {QZINO_CODE}</a>}
          >
            The first period hasn&apos;t been announced. Get your Qzino account ready with code {QZINO_CODE} so you count from day one.
          </EmptyState>
        </>
      ) : (
        <>
          {/* prize headline */}
          <header className="pb-10 pt-4 text-center">
            <p className="font-mono text-6xl font-bold text-gold drop-shadow-[0_0_30px_rgb(255_215_106/0.35)] sm:text-8xl">
              <ReelNumber value={formatMoney(period.prize_pool)} />
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl"><span className="chrome">{period.title}</span></h1>
            {period.state === "live" && <p className="eyebrow mt-3">● Live</p>}
          </header>

          {rows.length ? (
            <Podium rows={rows} prizes={prizes} />
          ) : (
            <EmptyState title="Nobody on the board yet" action={<CopyCode code={QZINO_CODE} />}>
              Wagers show up here once they&apos;re counted. Sign up with the code and start climbing.
            </EmptyState>
          )}

          {/* timer */}
          <Reveal className="mt-12 flex flex-col items-center gap-3">
            <p className="font-head text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {period.state === "live" ? "Ends in" : period.state === "upcoming" ? "Starts in" : "Final results"}
            </p>
            {period.state !== "ended" && <Countdown to={period.state === "live" ? period.ends_at : period.starts_at} size="lg" />}
            <p className="text-sm text-muted">{fmtDate(period.starts_at)} — {fmtDate(period.ends_at)} (UTC)</p>
          </Reveal>

          {rows.length > 0 && (
            <div className="mt-12"><BoardExplorer rows={rows} rules={RULES} /></div>
          )}
        </>
      )}

      {/* history */}
      {board && board.previous.length > 0 && (
        <section id="history" className="mt-20 scroll-mt-28">
          <h2 className="mb-6 font-display text-4xl"><span className="chrome">Leaderboard</span> <span className="neon-text">history</span></h2>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {board.previous.map((x) => (
              <div key={x.id} className="panel neon-frame flex h-full flex-col items-center p-6 text-center">
                <div className="relative size-20 overflow-hidden rounded-full border-2 border-gold bg-black shadow-[0_0_24px_rgb(255_215_106/0.3)]">
                  <Image src="/media/podium/1.webp" alt="King" fill sizes="80px" className="object-cover" />
                </div>
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-dim">Winner</p>
                <p className="font-head font-bold">{x.winner ?? "No entries"}</p>
                <div className="my-4 h-px w-full bg-line" />
                <p className="font-head text-lg font-bold">{monthOf(x.starts_at)}</p>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-dim">Ended {fmtDate(x.ends_at)}</p>
                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-dim">Total prize pool</p>
                <p className="font-mono text-2xl font-bold text-gold">{formatMoney(x.prize_pool)}</p>
                <Link href={`/leaderboard?p=${x.id}`} className="btn btn-ghost btn-sm mt-4">View results</Link>
              </div>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}
