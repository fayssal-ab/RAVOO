// E2E for duo (2v2) tournaments against a throwaway database:
//   DB_NAME=ravo_test node --env-file-if-exists=.env.local --conditions=react-server --import tsx --test tests/e2e/knockout-duo.test.ts
import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  addPlayerManually, closeRegistration, confirmRoll, createKo, decideTeamBattle, disqualifyPlayer, getKoArchive, getKoById,
  getKoState, makeTeams, openRegistration, recordBattleResult, rollPlayers, startBattle,
} from "../../lib/knockout";
import { getPool } from "../../lib/db";

if (process.env.DB_NAME !== "ravo_test") throw new Error("refusing to run outside ravo_test");
after(() => getPool().end());
const slot = (n: string) => ({ id: `d-${n}`, name: `Slot ${n}`, provider: "Test", imageUrl: "" });
const state = async (id: number) => getKoState((await getKoById(id))!);
const b = (cost: string, payout: string) => ({ cost, payout });

test("team score is the sum of both multipliers", () => {
  // 2x + 10x = 12x beats 5x + 5x = 10x even though team 2 has the better single bonus average
  const d = decideTeamBattle(b("100", "200"), b("100", "1000"), b("100", "500"), b("100", "500"));
  assert.equal(d.side, 1);
  assert.equal(d.m1, "12.00");
  assert.equal(d.m2, "10.00");
  assert.equal(decideTeamBattle(b("1", "2"), b("1", "3"), b("1", "4"), b("1", "1")).side, "tie");
});

test("duo: odd count refused, random teams, 2v2 totals, team DQ, finish", async () => {
  await getPool().query("UPDATE ko_tournaments SET status = 'cancelled' WHERE status IN ('open','closed')");
  const id = await createKo({ title: "Duo test", prize: "", size: 4, duo: true });
  let s = await state(id);
  assert.equal(s.capacity, 8);
  await openRegistration(id);
  const names = ["a1", "a2", "a3", "a4", "a5", "a6", "a7"];
  for (const u of names) await addPlayerManually(u, slot(u));
  await closeRegistration(id);
  await assert.rejects(makeTeams(id), /odd_players/);
  await assert.rejects(rollPlayers(id), /make_teams_first/);
  await openRegistration(id);
  await addPlayerManually("a8", slot("a8")); // 8th seat → auto-closed
  assert.equal((await getKoById(id))!.status, "closed");
  assert.equal((await makeTeams(id)).teams, 4);
  await assert.rejects(openRegistration(id), /ko_full|teams_made/);

  s = await state(id);
  const captains = s.participants.filter((p) => p.partner);
  assert.equal(captains.length, 4);
  assert.equal(s.eligible, 4);
  const teamOf = new Map<number, number>();
  for (const p of s.participants) teamOf.set(p.id, p.team_id!);
  assert.equal(new Set(teamOf.values()).size, 4);

  // two semis
  await rollPlayers(id); await confirmRoll(id);
  await rollPlayers(id); await confirmRoll(id);
  s = await state(id);
  const [semiA, semiB] = s.matches.filter((m) => m.round === 1);
  assert.equal(semiA.status, "ready");
  assert.ok(semiA.p1?.partner && semiA.p2?.partner);
  // partners mirror the captain's state
  assert.equal(s.participants.find((p) => p.id === semiA.p1!.partner!.id)!.state, "in_knockout");

  // semi A: the partner of side 2 is disqualified → whole team forfeits
  const r = await disqualifyPlayer(id, semiA.p2!.partner!.id);
  assert.equal(r.forfeit, semiA.id);
  s = await state(id);
  const doneA = s.matches.find((m) => m.id === semiA.id)!;
  assert.equal(doneA.winner_id, semiA.p1!.id);
  assert.ok(s.participants.filter((p) => p.team_id === semiA.p2!.id).every((p) => p.disqualified));

  // semi B played 2v2: duo needs all four bonuses
  await startBattle(id);
  const live = (await state(id)).live!;
  await assert.rejects(recordBattleResult(id, live.id, b("100", "100"), b("100", "100")), /invalid_input/);
  await recordBattleResult(id, live.id, b("100", "200"), b("100", "100"), { p1b: b("100", "100"), p2b: b("100", "900") });
  s = await state(id);
  const doneB = s.matches.find((m) => m.id === semiB.id)!;
  assert.equal(doneB.winner_id, semiB.p2!.id); // 1x + 9x = 10x beats 2x + 1x = 3x
  assert.equal(doneB.p1_multi, "3.00");
  assert.equal(doneB.p2_multi, "10.00");

  // champion only: no 3rd-place match; final played
  assert.equal(s.matches.find((m) => m.round === 2 && m.match_index === 1), undefined);
  await startBattle(id);
  const fin = (await state(id)).live!;
  await recordBattleResult(id, fin.id, b("100", "500"), b("100", "100"), { p1b: b("100", "500"), p2b: b("100", "100") });
  const t = (await getKoById(id))!;
  assert.equal(t.status, "finished");
  s = await state(id);
  const champ = s.participants.find((p) => p.id === Number(t.champion_id))!;
  assert.equal(champ.state, "champion");
  assert.equal(s.participants.find((p) => p.id === champ.partner!.id)!.state, "champion");
  const archived = (await getKoArchive(1))[0];
  assert.equal(archived.champion, `${champ.username} & ${champ.partner!.username}`);
});
