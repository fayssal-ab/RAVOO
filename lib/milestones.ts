import "server-only";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { d } from "./money";
import { AppError, withTx } from "./tx";

// Wager milestones, monthly. A viewer's wager for the month is the sum of
// their wagers on the leaderboard periods that start that month (UTC),
// matched by their Qzino username. Each milestone can be claimed once per
// month; the team checks and pays it from Admin → Milestones.

export interface Milestone { id: number; name: string; min_wager: string; reward: string }
export interface Claim {
  id: number; account_id: number; display_name: string; milestone_name: string; qzino_username: string;
  wagered: string; reward: string; status: "pending" | "paid" | "rejected"; admin_note: string; created_at: string;
  claim_month: string;
}

/** "YYYY-MM" of a date in UTC (the milestone month). */
export const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

let schema: Promise<void> | null = null;
/** Migration 0010 on first use if it hasn't been run (DDL: outside transactions). */
function ensureMonthly(): Promise<void> {
  schema ??= (async () => {
    const pool = getPool();
    const [cols] = await pool.query<RowDataPacket[]>(
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'milestone_claims' AND COLUMN_NAME = 'claim_month'");
    if (cols[0]) return;
    await pool.query("ALTER TABLE milestone_claims ADD COLUMN claim_month CHAR(7) NOT NULL DEFAULT ''");
    await pool.query("UPDATE milestone_claims SET claim_month = DATE_FORMAT(created_at, '%Y-%m') WHERE claim_month = ''");
    await pool.query("ALTER TABLE milestone_claims ADD UNIQUE KEY uq_claim_month (account_id, milestone_id, claim_month)");
    await pool.query("ALTER TABLE milestone_claims DROP INDEX uq_claim");
  })().catch((e) => { schema = null; throw e; });
  return schema;
}

export async function listMilestones(): Promise<Milestone[]> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT id, name, min_wager, reward FROM milestones ORDER BY min_wager");
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), min_wager: String(r.min_wager), reward: String(r.reward) }));
}

/** Wager this month (periods starting in `month`) for a Qzino username (decimal string). */
export async function monthlyWager(qzinoUsername: string, month = monthKey(), conn: Pool | PoolConnection = getPool()): Promise<string> {
  if (!qzinoUsername) return "0";
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(e.wagered), 0) AS total FROM lb_entries e JOIN lb_periods p ON p.id = e.period_id
      WHERE LOWER(e.username) = LOWER(?) AND DATE_FORMAT(p.starts_at, '%Y-%m') = ?`, [qzinoUsername, month]);
  return String(rows[0].total);
}

/** This month's claims of an account, by milestone. */
export async function claimsFor(accountId: number, month = monthKey()): Promise<Map<number, Claim["status"]>> {
  await ensureMonthly();
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT milestone_id, status FROM milestone_claims WHERE account_id = ? AND claim_month = ?", [accountId, month]);
  return new Map(rows.map((r) => [Number(r.milestone_id), r.status]));
}

export async function claimMilestone(accountId: number, milestoneId: number): Promise<number> {
  await ensureMonthly();
  const month = monthKey();
  return withTx(async (conn) => {
    const [acc] = await conn.query<RowDataPacket[]>("SELECT qzino_username, banned FROM user_accounts WHERE id = ? FOR UPDATE", [accountId]);
    if (!acc[0]) throw new AppError("not_signed_in");
    if (Number(acc[0].banned)) throw new AppError("banned");
    const qzino = String(acc[0].qzino_username);
    if (!qzino) throw new AppError("no_qzino");
    const [ms] = await conn.query<RowDataPacket[]>("SELECT id, name, min_wager, reward FROM milestones WHERE id = ?", [milestoneId]);
    if (!ms[0]) throw new AppError("not_found");
    const wagered = await monthlyWager(qzino, month, conn);
    if (d(wagered).lt(d(ms[0].min_wager))) throw new AppError("not_reached");
    const [dupe] = await conn.query<RowDataPacket[]>("SELECT id FROM milestone_claims WHERE account_id = ? AND milestone_id = ? AND claim_month = ?", [accountId, milestoneId, month]);
    if (dupe[0]) throw new AppError("already_claimed");
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO milestone_claims (account_id, milestone_id, milestone_name, qzino_username, wagered, reward, claim_month)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, milestoneId, ms[0].name, qzino, wagered, ms[0].reward, month]
    );
    return res.insertId;
  });
}

export async function listClaims(opts: { status?: Claim["status"]; accountId?: number; limit?: number } = {}): Promise<Claim[]> {
  await ensureMonthly();
  const where: string[] = [];
  const args: unknown[] = [];
  if (opts.status) { where.push("c.status = ?"); args.push(opts.status); }
  if (opts.accountId != null) { where.push("c.account_id = ?"); args.push(opts.accountId); }
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT c.*, a.display_name FROM milestone_claims c JOIN user_accounts a ON a.id = c.account_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY c.id DESC LIMIT ?`, [...args, opts.limit ?? 100]);
  return rows.map((r) => ({
    id: Number(r.id), account_id: Number(r.account_id), display_name: String(r.display_name), milestone_name: String(r.milestone_name),
    qzino_username: String(r.qzino_username), wagered: String(r.wagered), reward: String(r.reward), status: r.status,
    admin_note: String(r.admin_note), created_at: String(r.created_at), claim_month: String(r.claim_month ?? ""),
  }));
}

export async function resolveClaim(id: number, status: "paid" | "rejected", note: string): Promise<void> {
  const [res] = await getPool().query<ResultSetHeader>(
    "UPDATE milestone_claims SET status = ?, admin_note = ? WHERE id = ? AND status = 'pending'", [status, note, id]);
  if (!res.affectedRows) throw new AppError("invalid_input", "already resolved");
}

/** Admin: a rejected claim can be deleted so the viewer may claim again. */
export async function deleteClaim(id: number): Promise<void> {
  await getPool().query("DELETE FROM milestone_claims WHERE id = ? AND status = 'rejected'", [id]);
}

export async function saveMilestones(rows: { id: number | null; name: string; min_wager: string; reward: string }[]): Promise<void> {
  await withTx(async (conn) => {
    const keep = rows.filter((r) => r.id != null).map((r) => r.id);
    await conn.query(`DELETE FROM milestones ${keep.length ? "WHERE id NOT IN (?)" : ""}`, keep.length ? [keep] : []);
    // park thresholds first so the UNIQUE index survives reordering
    await conn.query("UPDATE milestones SET min_wager = 999999999999 - id");
    for (const r of rows) {
      if (r.id != null) await conn.query("UPDATE milestones SET name = ?, min_wager = ?, reward = ? WHERE id = ?", [r.name, r.min_wager, r.reward, r.id]);
      else await conn.query("INSERT INTO milestones (name, min_wager, reward) VALUES (?, ?, ?)", [r.name, r.min_wager, r.reward]);
    }
  });
}
