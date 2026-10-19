import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { getQboardsBoard } from "./qboards";
import { applyPoints } from "./account";
import { AppError, withTx } from "./tx";

export interface AdminUser {
  id: number;
  display_name: string;
  qzino_username: string;
  points: number;
  xp: number;
  banned: boolean;
  created_at: string;
  last_login_at: string | null;
  providers: string;
}

export async function searchUsers(q: string, limit = 50): Promise<AdminUser[]> {
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT a.id, a.display_name, a.qzino_username, a.points, a.xp, a.banned, a.created_at, a.last_login_at,
            COALESCE(GROUP_CONCAT(CONCAT(i.provider, ':', i.username) ORDER BY i.provider SEPARATOR ' · '), '') AS providers
       FROM user_accounts a LEFT JOIN user_identities i ON i.account_id = a.id
      WHERE ? = '' OR a.display_name LIKE ? OR a.qzino_username LIKE ? OR i.username LIKE ?
      GROUP BY a.id ORDER BY a.xp DESC, a.id LIMIT ?`,
    [q, like, like, like, limit]
  );
  return rows.map((r) => ({
    id: Number(r.id), display_name: String(r.display_name), qzino_username: String(r.qzino_username), points: Number(r.points),
    xp: Number(r.xp), banned: Boolean(Number(r.banned)), created_at: String(r.created_at), last_login_at: r.last_login_at ? String(r.last_login_at) : null,
    providers: String(r.providers),
  }));
}

/** Grant (delta > 0, also raises xp) or deduct points from one account. */
export async function adjustPoints(accountId: number, delta: number, note: string): Promise<void> {
  if (!Number.isInteger(delta) || delta === 0) throw new AppError("invalid_input", "amount must be a non-zero whole number");
  await withTx((conn) => applyPoints(conn, accountId, delta, delta > 0 ? "grant" : "deduct", note));
}

/**
 * Bulk grant from pasted lines "name,points". The name matches a Qzino
 * username, a Kick/Discord username or a display name (case-insensitive,
 * first match wins). Unknown names are reported, not created.
 */
export async function bulkGrant(lines: { name: string; points: number }[], note: string): Promise<{ granted: number; unknown: string[] }> {
  const unknown: string[] = [];
  let granted = 0;
  await withTx(async (conn) => {
    for (const l of lines) {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT a.id FROM user_accounts a LEFT JOIN user_identities i ON i.account_id = a.id
          WHERE LOWER(a.qzino_username) = LOWER(?) OR LOWER(i.username) = LOWER(?) OR LOWER(a.display_name) = LOWER(?)
          ORDER BY (LOWER(a.qzino_username) = LOWER(?)) DESC, a.id LIMIT 1`,
        [l.name, l.name, l.name, l.name]
      );
      if (!rows[0]) { unknown.push(l.name); continue; }
      await applyPoints(conn, Number(rows[0].id), l.points, "grant", note);
      granted++;
    }
  });
  return { granted, unknown };
}

export async function setBanned(accountId: number, banned: boolean): Promise<void> {
  await getPool().query("UPDATE user_accounts SET banned = ? WHERE id = ?", [banned ? 1 : 0, accountId]);
  if (banned) await getPool().query("DELETE FROM user_sessions WHERE account_id = ?", [accountId]);
}

export async function adminSetQzino(accountId: number, username: string): Promise<void> {
  await getPool().query("UPDATE user_accounts SET qzino_username = ? WHERE id = ?", [username, accountId]);
}

export interface Stats { users: number; points_out: number; pending: number; open_raffles: number; live_period: string | null; board_players: number }

export async function getStats(): Promise<Stats> {
  const [[u], [r], [rf], board] = await Promise.all([
    getPool().query<RowDataPacket[]>("SELECT COUNT(*) AS n, COALESCE(SUM(points), 0) AS pts FROM user_accounts"),
    getPool().query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM store_redemptions WHERE status = 'pending'"),
    getPool().query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM raffles WHERE status = 'open'"),
    getQboardsBoard(1000).catch(() => null),
  ]);
  const live = board?.period?.state === "live" ? board : null;
  return {
    users: Number(u[0].n), points_out: Number(u[0].pts), pending: Number(r[0].n), open_raffles: Number(rf[0].n),
    live_period: live ? live.period!.title : null, board_players: live ? live.rows.length : 0,
  };
}

export async function saveRanks(rows: { level: number; name: string; min_xp: number }[]): Promise<void> {
  const sorted = [...rows].sort((a, b) => a.level - b.level);
  if (sorted[0]?.min_xp !== 0) throw new AppError("invalid_input", "level 1 must start at 0 XP");
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_xp <= sorted[i - 1].min_xp) throw new AppError("invalid_input", `level ${sorted[i].level} needs more XP than level ${sorted[i - 1].level}`);
  }
  await withTx(async (conn) => {
    // two passes keep the UNIQUE(min_xp) index happy while thresholds shift
    for (const r of sorted) await conn.query("UPDATE ranks SET min_xp = ? WHERE level = ?", [1_000_000_000_000 + r.level, r.level]);
    for (const r of sorted) await conn.query("UPDATE ranks SET name = ?, min_xp = ? WHERE level = ?", [r.name, r.min_xp, r.level]);
  });
}
