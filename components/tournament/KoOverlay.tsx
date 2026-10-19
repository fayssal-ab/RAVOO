"use client";

import { useState } from "react";
import { Podium, RollReveal, VsScreen, roundName } from "./parts";
import { useKoState } from "./useKoState";

// OBS overlay (1920×1080, transparent): the focused battle big and centred,
// the roller reveal, then the podium. Polls the public state.
export function KoOverlay() {
  const { state } = useKoState(null, 1500);
  const [revealed, setRevealed] = useState<number | null>(null);
  if (!state) return null;
  const t = state.tournament;
  const focus = state.focus;
  const pool = state.participants.filter((p) => p.state === "registered");
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center p-10">
      <div className="w-full max-w-[1500px] rounded-[2rem] border-2 border-neon/40 bg-bg/85 p-10 shadow-[0_0_120px_-30px_rgb(141_255_74/0.6)] backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-display text-5xl"><span className="chrome">{t.title}</span></p>
          <p className="font-head text-xl font-bold uppercase tracking-[0.2em] text-neon">
            {t.status === "open" ? `!join · ${state.registered}/${t.max_players}` : focus ? roundName(t.max_players, focus.round) : ""}
          </p>
        </div>
        {state.champion ? (
          <Podium state={state} />
        ) : focus && focus.status !== "empty" ? (
          focus.status === "rolled" && revealed !== focus.roll_seq ? (
            <RollReveal key={`roll-${focus.roll_seq}`} match={focus} pool={pool} size={t.max_players} big onDone={() => setRevealed(focus.roll_seq)} />
          ) : (
            <VsScreen key={`${focus.id}-${focus.status}-${focus.winner_id}`} match={focus} size={t.max_players} big />
          )
        ) : (
          <p className="py-20 text-center font-display text-7xl"><span className="chrome">Type</span> <span className="neon-text">!join</span></p>
        )}
      </div>
    </div>
  );
}
