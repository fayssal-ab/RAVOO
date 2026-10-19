"use client";

import type { KoState } from "@/lib/knockout";
import { Bracket, Counter, ParticipantRow, Podium, VsScreen } from "./parts";
import { useKoState } from "./useKoState";

// Public live view: refreshes every few seconds while a tournament runs.
export function KoPublic({ initial, id }: { initial: KoState; id?: number }) {
  const running = initial.tournament.status === "open" || initial.tournament.status === "closed";
  const { state } = useKoState(initial, running ? 4000 : 60_000, id);
  const s = state ?? initial;
  const t = s.tournament;
  const current = s.live ?? s.focus;

  return (
    <div className="space-y-8">
      <div className="panel neon-frame is-on flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="eyebrow">{t.max_players}-player knockout{t.prize ? ` · ${t.prize}` : ""}</p>
          <h2 className="mt-1 font-display text-4xl"><span className="chrome">{t.title}</span></h2>
          {t.status === "open" && (
            <p className="mt-2 max-w-xl text-sm text-muted">
              Type <code className="rounded bg-surface-3 px-1.5 text-neon">!join Gates of Olympus</code> in Kick chat to enter with that slot (plain <code className="rounded bg-surface-3 px-1.5 text-neon">!join</code> = random slot). Type it again before you&apos;re drawn to change slot.
            </p>
          )}
        </div>
        <Counter value={s.registered} max={t.max_players} open={t.status === "open"} />
      </div>

      {s.champion ? (
        <Podium state={s} />
      ) : current && current.status !== "empty" && current.status !== "void" ? (
        <section className="panel overflow-hidden p-4 sm:p-8"><VsScreen key={`${current.id}-${current.status}-${current.winner_id}`} match={current} size={t.max_players} /></section>
      ) : null}

      <section className="panel p-5">
        <p className="eyebrow mb-4">Bracket</p>
        <Bracket state={s} />
      </section>

      {s.participants.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Players ({s.registered})</p>
          <ol className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">{s.participants.map((p, i) => <ParticipantRow key={p.id} p={p} index={i} />)}</ol>
        </section>
      )}
    </div>
  );
}
