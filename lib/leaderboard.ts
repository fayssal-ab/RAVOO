import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { maskUsername } from "./mask";
import { sumDecimals } from "./money";
import { AppError, withTx } from "./tx";
import { getQboardsBoard } from "./qboards";

// Wager leaderboard. There is no Qzino feed yet: an admin creates periods and
// enters wagers (one by one or pasted as CSV). Rank is computed in SQL (a
// tie goes to the wager recorded first, so every place has one prize);
// usernames are masked before anything leaves the server.

export interface Period {
  id: number;
  title: string;
  starts_at: string; // "YYYY-MM-DD HH:MM:SS" UTC
  ends_at: string;
  prize_pool: string;
  state: "upcoming" | "live" | "ended";
}

export interface Prize { place: number; amount: string }
export interface BoardRow { rank: number; name: string; wagered: string; prize: string | null }
export interface PastPeriod extends Period { winner: string | null }
export interface Board { period: Period | null; prizes: Prize[]; rows: BoardRow[]; previous: PastPeriod[]; source?: "qboards"; scoreKind?: "points" | "wagered"; syncedAt?: string; syncDelayed?: boolean }

const STATE_SQL = `CASE WHEN UTC_TIMESTAMP() < starts_at THEN 'upcoming' WHEN UTC_TIMESTAMP() < ends_at THEN 'live' ELSE 'ended' END`;
const toPeriod = (r: RowDataPacket): Period => ({
  id: Number(r.id), title: String(r.title), starts_at: String(r.starts_at), ends_at: String(r.ends_at),
  prize_pool: String(r.prize_pool), state: r.state,
});

export async function listPeriods(): Promise<Period[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT id, title, starts_at, ends_at, prize_pool, ${STATE_SQL} AS state FROM lb_periods ORDER BY starts_at DESC`);
  return rows.map(toPeriod);
}

/** Attach each ended period's #1 (masked). */
async function withWinners(list: Period[]): Promise<PastPeriod[]> {
  if (!list.length) return [];
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT e.period_id, e.username FROM lb_entries e
      JOIN (SELECT period_id, MAX(wagered) AS top FROM lb_entries WHERE period_id IN (?) GROUP BY period_id) t
        ON t.period_id = e.period_id AND t.top = e.wagered
      WHERE e.wagered > 0 ORDER BY e.updated_at, e.username`,
    [list.map((p) => p.id)]
  );
  const winner = new Map<number, string>();
  for (const r of rows) if (!winner.has(Number(r.period_id))) winner.set(Number(r.period_id), maskUsername(String(r.username)));
  return list.map((p) => ({ ...p, winner: winner.get(p.id) ?? null }));
}

async function prizesFor(periodId: number): Promise<Prize[]> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT place, amount FROM lb_prizes WHERE period_id = ? ORDER BY place", [periodId]);
  return rows.map((r) => ({ place: Number(r.place), amount: String(r.amount) }));
}

/**
 * The board for a period id, or the current one: the live period, else the
 * next upcoming, else the most recent ended. `null` period = nothing yet.
 */
export async function getBoard(periodId?: number, limit = 100): Promise<Board> {
  if (periodId == null) {
    const external = await getQboardsBoard(limit).catch((err: unknown) => {
      // Allow existing installations to run before migration 0006 is applied.
      if ((err as { code?: string }).code === "ER_NO_SUCH_TABLE") return null;
      throw err;
    });
    // The public current board uses Q-boards points exclusively. Never fall
    // back to manual dollar wagers while waiting for the first scheduled import.
    return external ?? { period: null, prizes: [], rows: [], previous: [], source: "qboards", scoreKind: "points" };
  }
  const periods = await listPeriods();
  const period =
    (periodId != null ? periods.find((p) => p.id === periodId) : undefined) ??
    (periodId == null
      ? periods.find((p) => p.state === "live") ??
        [...periods].reverse().find((p) => p.state === "upcoming") ??
        periods.find((p) => p.state === "ended")
      : undefined) ??
    null;
  const previous = await withWinners(periods.filter((p) => p.state === "ended" && p.id !== period?.id).slice(0, 12));
  if (!period) return { period: null, prizes: [], rows: [], previous };

  const prizes = await prizesFor(period.id);
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT username, wagered, ROW_NUMBER() OVER (ORDER BY wagered DESC, updated_at, username) AS rnk
       FROM lb_entries WHERE period_id = ? AND wagered > 0 ORDER BY rnk LIMIT ?`,
    [period.id, limit]
  );
  const prizeByPlace = new Map(prizes.map((p) => [p.place, p.amount]));
  return {
    period,
    prizes,
    previous,
    rows: rows.map((r) => ({
      rank: Number(r.rnk),
      name: maskUsername(String(r.username)),
      wagered: String(r.wagered),
      prize: prizeByPlace.get(Number(r.rnk)) ?? null,
    })),
  };
}

// ── admin ────────────────────────────────────────────────────────────────
export interface PeriodInput { title: string; starts_at: string; ends_at: string; prizes: string[] }

export async function savePeriod(id: number | null, v: PeriodInput): Promise<number> {
  if (v.ends_at <= v.starts_at) throw new AppError("bad_dates");
  return withTx(async (conn) => {
    const [overlap] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM lb_periods WHERE starts_at < ? AND ends_at > ? AND id <> ? LIMIT 1", [v.ends_at, v.starts_at, id ?? 0]);
    if (overlap[0]) throw new AppError("overlap");
    const pool = sumDecimals(v.prizes);
    let periodId = id;
    if (periodId == null) {
      const [res] = await conn.query<ResultSetHeader>(
        "INSERT INTO lb_periods (title, starts_at, ends_at, prize_pool) VALUES (?, ?, ?, ?)", [v.title, v.starts_at, v.ends_at, pool]);
      periodId = res.insertId;
    } else {
      const [res] = await conn.query<ResultSetHeader>(
        "UPDATE lb_periods SET title = ?, starts_at = ?, ends_at = ?, prize_pool = ? WHERE id = ?", [v.title, v.starts_at, v.ends_at, pool, periodId]);
      if (!res.affectedRows) throw new AppError("not_found");
      await conn.query("DELETE FROM lb_prizes WHERE period_id = ?", [periodId]);
    }
    for (const [i, amount] of v.prizes.entries()) {
      await conn.query("INSERT INTO lb_prizes (period_id, place, amount) VALUES (?, ?, ?)", [periodId, i + 1, amount]);
    }
    return periodId;
  });
}

export async function deletePeriod(id: number): Promise<void> {
  await getPool().query("DELETE FROM lb_periods WHERE id = ?", [id]);
}

/** Upsert wagers. `replace` clears the period's entries first (CSV import). */
export async function upsertEntries(periodId: number, entries: { username: string; wagered: string }[], replace: boolean): Promise<number> {
  return withTx(async (conn) => {
    const [p] = await conn.query<RowDataPacket[]>("SELECT id FROM lb_periods WHERE id = ? FOR UPDATE", [periodId]);
    if (!p[0]) throw new AppError("not_found");
    if (replace) await conn.query("DELETE FROM lb_entries WHERE period_id = ?", [periodId]);
    for (const e of entries) {
      await conn.query(
        "INSERT INTO lb_entries (period_id, username, wagered) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE wagered = VALUES(wagered)",
        [periodId, e.username, e.wagered]
      );
    }
    return entries.length;
  });
}

export async function removeEntry(periodId: number, username: string): Promise<void> {
  await getPool().query("DELETE FROM lb_entries WHERE period_id = ? AND username = ?", [periodId, username]);
}

/** Admin view: unmasked names. */
export async function adminEntries(periodId: number): Promise<{ username: string; wagered: string }[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT username, wagered FROM lb_entries WHERE period_id = ? ORDER BY wagered DESC, updated_at, username", [periodId]);
  return rows.map((r) => ({ username: String(r.username), wagered: String(r.wagered) }));
}
