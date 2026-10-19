import "server-only";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { d } from "./money";
import { getSlot } from "./slots";
import { AppError, lockApp, withTx } from "./tx";

// Bonus hunt (rules ported from ONO). The hunt collects bonuses with a bet
// each (slot art from the catalogue); wins fill in as they're opened.
//
// - start balance = the bankroll Ravo announces;
// - break-even    = average multiplier still needed on the UNOPENED bonuses
//                   to win the start balance back;
// - final balance = sum of all wins once every bonus is opened;
// - profit        = final balance − start balance.
//
// Lifecycle: one hunt runs at a time ('collecting' → 'opening' → 'finished').
// The first win moves it to 'opening' and locks the bonus list (wins can
// still be corrected). Finishing needs every bonus opened (0 counts).

export type HuntStatus = "collecting" | "opening" | "finished";

export interface Bonus {
  id: number; slot: string; provider: string; called_by: string; image_url: string | null;
  bet: string; win: string | null; multi: number | null;
}

export interface Hunt {
  id: number; title: string; start_balance: string; status: HuntStatus; created_at: string; finished_at: string | null;
  bonuses: Bonus[];
  stats: {
    total_bet: string; won: string; opened: number; count: number;
    avg_multi: number | null; req_multi: number | null; profit: string; complete: boolean;
    best: Bonus | null; worst: Bonus | null;
  };
}
export interface HuntSummary { id: number; title: string; status: HuntStatus; created_at: string; start_balance: string; won: string; count: number; best_multi: number | null }

export async function listHunts(limit = 30): Promise<HuntSummary[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT h.id, h.title, h.status, h.created_at, h.start_balance, COUNT(b.id) AS n, COALESCE(SUM(b.win), 0) AS won,
            MAX(CASE WHEN b.bet > 0 AND b.win IS NOT NULL THEN b.win / b.bet END) AS best
       FROM bonus_hunts h LEFT JOIN hunt_bonuses b ON b.hunt_id = h.id
      GROUP BY h.id ORDER BY FIELD(h.status, 'opening', 'collecting', 'finished'), h.id DESC LIMIT ?`, [limit]);
  return rows.map((r) => ({
    id: Number(r.id), title: String(r.title), status: r.status, created_at: String(r.created_at), start_balance: String(r.start_balance),
    won: String(r.won), count: Number(r.n), best_multi: r.best != null ? Math.round(Number(r.best) * 100) / 100 : null,
  }));
}

/** A hunt by id, or the running one (else the latest). */
export async function getHunt(id?: number): Promise<Hunt | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    id != null ? "SELECT * FROM bonus_hunts WHERE id = ?" : "SELECT * FROM bonus_hunts ORDER BY (status <> 'finished') DESC, id DESC LIMIT 1",
    id != null ? [id] : []
  );
  const h = rows[0];
  if (!h) return null;
  const [bs] = await pool.query<RowDataPacket[]>("SELECT * FROM hunt_bonuses WHERE hunt_id = ? ORDER BY sort, id", [h.id]);
  const bonuses: Bonus[] = bs.map((b) => {
    const win = b.win == null ? null : String(b.win);
    return {
      id: Number(b.id), slot: String(b.slot), provider: String(b.provider), called_by: String(b.called_by),
      image_url: b.image_url ? String(b.image_url) : null, bet: String(b.bet), win,
      multi: win != null && d(b.bet).gt(0) ? d(win).div(d(b.bet)).toDecimalPlaces(2).toNumber() : null,
    };
  });
  const totalBet = bonuses.reduce((a, b) => a.plus(d(b.bet)), d(0));
  const opened = bonuses.filter((b) => b.win != null);
  const won = opened.reduce((a, b) => a.plus(d(b.win!)), d(0));
  const openedBet = opened.reduce((a, b) => a.plus(d(b.bet)), d(0));
  const remainingBet = totalBet.minus(openedBet);
  const needed = d(h.start_balance).minus(won);
  const ranked = opened.filter((b) => b.multi != null).sort((a, b) => b.multi! - a.multi!);
  return {
    id: Number(h.id), title: String(h.title), start_balance: String(h.start_balance), status: h.status,
    created_at: String(h.created_at), finished_at: h.finished_at ? String(h.finished_at) : null,
    bonuses,
    stats: {
      total_bet: totalBet.toFixed(2), won: won.toFixed(2), opened: opened.length, count: bonuses.length,
      avg_multi: openedBet.gt(0) ? won.div(openedBet).toDecimalPlaces(2).toNumber() : null,
      req_multi: remainingBet.gt(0) ? Math.max(0, needed.div(remainingBet).toDecimalPlaces(2).toNumber()) : null,
      profit: won.minus(d(h.start_balance)).toFixed(2),
      complete: bonuses.length > 0 && opened.length === bonuses.length,
      best: ranked[0] ?? null,
      worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    },
  };
}

// ── admin ────────────────────────────────────────────────────────────────

async function lockHunt(conn: PoolConnection, id: number): Promise<RowDataPacket> {
  const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM bonus_hunts WHERE id = ? FOR UPDATE", [id]);
  if (!rows[0]) throw new AppError("not_found");
  return rows[0];
}

async function lockEditable(conn: PoolConnection, id: number): Promise<RowDataPacket> {
  const h = await lockHunt(conn, id);
  if (h.status === "finished") throw new AppError("hunt_finished");
  if (h.status === "opening") throw new AppError("hunt_opening");
  return h;
}

export async function createHunt(title: string, startBalance: string): Promise<number> {
  return withTx(async (conn) => {
    await lockApp(conn, "hunt");
    const [running] = await conn.query<RowDataPacket[]>("SELECT id FROM bonus_hunts WHERE status <> 'finished' LIMIT 1");
    if (running[0]) throw new AppError("hunt_running", `#${running[0].id} is still running`);
    const [res] = await conn.query<ResultSetHeader>("INSERT INTO bonus_hunts (title, start_balance) VALUES (?, ?)", [title, startBalance]);
    return res.insertId;
  });
}

/** Title any time; start balance only while collecting. */
export async function updateHunt(id: number, v: { title: string; start_balance: string }): Promise<void> {
  await withTx(async (conn) => {
    const h = await lockHunt(conn, id);
    const balance = h.status === "collecting" ? v.start_balance : String(h.start_balance);
    await conn.query("UPDATE bonus_hunts SET title = ?, start_balance = ? WHERE id = ?", [v.title, balance, id]);
  });
}

export async function deleteHunt(id: number): Promise<void> {
  await getPool().query("DELETE FROM bonus_hunts WHERE id = ?", [id]);
}

/** Add from the catalogue (name/provider/art come from the DB) or as typed. */
export async function addBonus(huntId: number, v: { slot_id: string; slot: string; provider: string; called_by: string; bet: string }): Promise<string> {
  const cat = v.slot_id ? await getSlot(v.slot_id) : null;
  if (v.slot_id && !cat) throw new AppError("not_found", "slot not in the catalogue");
  const name = cat?.name ?? v.slot;
  if (!name) throw new AppError("invalid_input", "pick or type a slot");
  await withTx(async (conn) => {
    await lockEditable(conn, huntId);
    const [c] = await conn.query<RowDataPacket[]>("SELECT COUNT(*) AS n, COALESCE(MAX(sort), 0) AS s FROM hunt_bonuses WHERE hunt_id = ?", [huntId]);
    if (Number(c[0].n) >= 500) throw new AppError("invalid_input", "500 bonuses max");
    await conn.query(
      "INSERT INTO hunt_bonuses (hunt_id, slot_id, slot, provider, image_url, called_by, bet, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [huntId, cat?.id ?? null, name, cat?.provider ?? v.provider, cat?.imageUrl ?? null, v.called_by, v.bet, Number(c[0].s) + 1]
    );
  });
  return name;
}

export async function deleteBonus(huntId: number, bonusId: number): Promise<void> {
  await withTx(async (conn) => {
    await lockEditable(conn, huntId);
    await conn.query("DELETE FROM hunt_bonuses WHERE id = ? AND hunt_id = ?", [bonusId, huntId]);
  });
}

export async function moveBonus(huntId: number, bonusId: number, dir: "up" | "down"): Promise<void> {
  await withTx(async (conn) => {
    await lockEditable(conn, huntId);
    const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM hunt_bonuses WHERE hunt_id = ? ORDER BY sort, id FOR UPDATE", [huntId]);
    const ids = rows.map((r) => Number(r.id));
    const i = ids.indexOf(bonusId);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    for (const [k, id] of ids.entries()) await conn.query("UPDATE hunt_bonuses SET sort = ? WHERE id = ?", [k + 1, id]);
  });
}

/** Record or correct a win (0 included). The first win starts the opening phase. */
export async function setBonusWin(huntId: number, bonusId: number, win: string | null): Promise<void> {
  await withTx(async (conn) => {
    const h = await lockHunt(conn, huntId);
    if (h.status === "finished") throw new AppError("hunt_finished");
    const [res] = await conn.query<ResultSetHeader>("UPDATE hunt_bonuses SET win = ? WHERE id = ? AND hunt_id = ?", [win, bonusId, huntId]);
    if (!res.affectedRows) throw new AppError("not_found");
    if (win != null && h.status === "collecting") {
      await conn.query("UPDATE bonus_hunts SET status = 'opening', opening_started_at = UTC_TIMESTAMP() WHERE id = ?", [huntId]);
    }
  });
}

export async function finishHunt(huntId: number): Promise<void> {
  await withTx(async (conn) => {
    const h = await lockHunt(conn, huntId);
    if (h.status === "finished") throw new AppError("hunt_finished");
    const [r] = await conn.query<RowDataPacket[]>("SELECT COUNT(*) AS n, SUM(win IS NULL) AS left_ FROM hunt_bonuses WHERE hunt_id = ?", [huntId]);
    if (Number(r[0].n) === 0) throw new AppError("invalid_input", "the hunt has no bonuses");
    if (Number(r[0].left_) > 0) throw new AppError("hunt_unopened", `${r[0].left_} bonus(es) still unopened`);
    await conn.query("UPDATE bonus_hunts SET status = 'finished', finished_at = UTC_TIMESTAMP() WHERE id = ?", [huntId]);
  });
}

/** Reopen a finished hunt (to fix a mistake). */
export async function reopenHunt(huntId: number): Promise<void> {
  await withTx(async (conn) => {
    await lockApp(conn, "hunt");
    const [running] = await conn.query<RowDataPacket[]>("SELECT id FROM bonus_hunts WHERE status <> 'finished' AND id <> ? LIMIT 1", [huntId]);
    if (running[0]) throw new AppError("hunt_running", `#${running[0].id} is running`);
    await conn.query("UPDATE bonus_hunts SET status = 'opening', finished_at = NULL WHERE id = ? AND status = 'finished'", [huntId]);
  });
}
