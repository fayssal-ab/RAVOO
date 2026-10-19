// E2E for tournament disqualification against a throwaway database:
//   DB_NAME=ravo_test node --env-file-if-exists=.env.local --conditions=react-server --import tsx --test tests/e2e/knockout-dq.test.ts
// (apply migrations to ravo_test first with DB_NAME=ravo_test npm run migrate)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addPlayerManually, closeRegistration, confirmRoll, createKo, disqualifyPlayer, getKoById, getKoState,
  openRegistration, recordBattleResult, recordJoin, resetKo, rollPlayers, startBattle,
} from "../../lib/knockout";
import { getPool } from "../../lib/db";
import { withTx } from "../../lib/tx";

if (process.env.DB_NAME !== "ravo_test") throw new Error("refusing to run outside ravo_test");
const slot = (n: string) => ({ id: `t-${n}`, name: `Slot ${n}`, provider: "Test", imageUrl: "" });
const state = async (id: number) => getKoState((await getKoById(id))!);
const byName = async (id: number, u: string) => (await state(id)).participants.find((p) => p.username === u)!;

import { after } from "node:test";
after(() => getPool().end());
test("disqualify: waiting player, in-bracket forfeit, champion only", async () => {
  await getPool().query("UPDATE ko_tournaments SET status = 'cancelled' WHERE status IN ('open','closed')");
  const id = await createKo({ title: "DQ test", prize: "", size: 4 });
  await openRegistration(id);
  for (const u of ["alice", "bob", "carol", "dave"]) await addPlayerManually(u, slot(u));
  // full → auto-closed; DQ dave while waiting: seat frees, can't rejoin
  await disqualifyPlayer(id, (await byName(id, "dave")).id);
  let s = await state(id);
  assert.equal(s.registered, 3);
  assert.equal((await byName(id, "dave")).disqualified, true);
  await openRegistration(id);
  const again = await withTx((c) => recordJoin(c, { kickUserId: "manual:dave", username: "dave", messageId: `x${Date.now()}`, slot: slot("d2") }));
  assert.equal(again.outcome, "disqualified");
  await addPlayerManually("erin", slot("erin"));
  s = await state(id);
  assert.equal(s.registered, 4);
  await closeRegistration(id).catch(() => {}); // already closed when full

  // semi 1 and 2
  await rollPlayers(id); await confirmRoll(id);
  await rollPlayers(id); await confirmRoll(id);
  s = await state(id);
  const semis = s.matches.filter((m) => m.round === 1);
  assert.ok(semis.every((m) => m.status === "ready"));
  // DQ a player in a ready semi → opponent wins by walkover
  const victim = semis[0].p1!;
  const opp = semis[0].p2!;
  const r = await disqualifyPlayer(id, victim.id);
  assert.equal(r.forfeit, semis[0].id);
  s = await state(id);
  const semi0 = s.matches.find((m) => m.id === semis[0].id)!;
  assert.equal(semi0.status, "done");
  assert.equal(semi0.winner_id, opp.id);
  // play the other semi normally
  await startBattle(id);
  const live = (await state(id)).live!;
  await recordBattleResult(id, live.id, { cost: "100", payout: "500" }, { cost: "100", payout: "200" });
  s = await state(id);
  const final = s.matches.find((m) => m.round === 2 && m.match_index === 0)!;
  const bronze = s.matches.find((m) => m.round === 2 && m.match_index === 1);
  assert.equal(final.status, "ready");
  // champion only: no 3rd-place match, both semi losers are out
  assert.equal(bronze, undefined);
  s = await state(id);
  assert.equal(s.participants.filter((p) => p.state === "eliminated").length, 3); // DQ'd + 2 semi losers
  // finish the final
  await startBattle(id);
  const f = (await state(id)).live!;
  await recordBattleResult(id, f.id, { cost: "100", payout: "300" }, { cost: "100", payout: "100" });
  const t = await getKoById(id);
  assert.equal(t!.status, "finished");
  await resetKo(id).catch(() => {});
});
