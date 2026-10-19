import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { applyPoints, getRanks } from "./account";
import { entriesHash, generateServerSeed, sha256, winnerIndex } from "./fair";
import { rankForXp } from "./ranks";
import { AppError, withTx } from "./tx";

// Points raffles. Viewers buy tickets with points; after the end an admin
// draws. The draw is provably fair (lib/fair.ts): the seed hash is public from
// creation, the seed and the frozen ticket list are published after the draw.

export interface Raffle {
  id: number;
  title: string;
  prize: string;
  cost: number;
  max_tickets: number;
  min_rank: number;
  winners: number;
  ends_at: string;
  ended: boolean;
  status: "open" | "drawn" | "cancelled";
  server_seed_hash: string;
  server_seed: string | null; // only once drawn
  entries_hash: string | null;
  tickets_snapshot: string[] | null;
  drawn_at: string | null;
  total_tickets: number;
  entrants: number;
  my_tickets: number;
  results: { place: number; display_name: string; ticket_index: number }[];
}

export async function listRaffles(viewerId: number | null, opts: { id?: number } = {}): Promise<Raffle[]> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, r.ends_at <= UTC_TIMESTAMP() AS ended, COALESCE(SUM(e.tickets), 0) AS total_tickets, COUNT(e.account_id) AS entrants,
            COALESCE(SUM(CASE WHEN e.account_id = ? THEN e.tickets END), 0) AS my_tickets
       FROM raffles r LEFT JOIN raffle_entries e ON e.raffle_id = r.id
      ${opts.id != null ? "WHERE r.id = ?" : ""}
      GROUP BY r.id
      ORDER BY (r.status = 'open') DESC, r.ends_at DESC LIMIT 50`,
    opts.id != null ? [viewerId ?? 0, opts.id] : [viewerId ?? 0]
  );
  const ids = rows.map((r) => Number(r.id));
  const winners = new Map<number, Raffle["results"]>();
  if (ids.length) {
    const [w] = await pool.query<RowDataPacket[]>(
      "SELECT raffle_id, place, display_name, ticket_index FROM raffle_winners WHERE raffle_id IN (?) ORDER BY place", [ids]);
    for (const r of w) {
      const list = winners.get(Number(r.raffle_id)) ?? [];
      list.push({ place: Number(r.place), display_name: String(r.display_name), ticket_index: Number(r.ticket_index) });
      winners.set(Number(r.raffle_id), list);
    }
  }
  return rows.map((r) => {
    const revealed = r.status !== "open";
    return {
      id: Number(r.id), title: String(r.title), prize: String(r.prize), cost: Number(r.cost), max_tickets: Number(r.max_tickets),
      min_rank: Number(r.min_rank), winners: Number(r.winners), ends_at: String(r.ends_at), ended: Boolean(Number(r.ended)), status: r.status,
      server_seed_hash: String(r.server_seed_hash),
      server_seed: revealed ? String(r.server_seed) : null,
      entries_hash: r.entries_hash ? String(r.entries_hash) : null,
      tickets_snapshot: revealed && r.tickets_snapshot ? String(r.tickets_snapshot).split("\n") : null,
      drawn_at: r.drawn_at ? String(r.drawn_at) : null,
      total_tickets: Number(r.total_tickets), entrants: Number(r.entrants), my_tickets: Number(r.my_tickets),
      results: winners.get(Number(r.id)) ?? [],
    };
  });
}

export async function buyTickets(accountId: number, raffleId: number, count: number): Promise<void> {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new AppError("invalid_input");
  const ranks = await getRanks();
  await withTx(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, title, cost, max_tickets, min_rank, status, ends_at <= UTC_TIMESTAMP() AS ended FROM raffles WHERE id = ? FOR UPDATE", [raffleId]);
    const r = rows[0];
    if (!r) throw new AppError("not_found");
    if (r.status !== "open" || Number(r.ended)) throw new AppError("closed");

    const [acc] = await conn.query<RowDataPacket[]>("SELECT xp, banned FROM user_accounts WHERE id = ? FOR UPDATE", [accountId]);
    if (!acc[0]) throw new AppError("not_signed_in");
    if (Number(acc[0].banned)) throw new AppError("banned");
    if (rankForXp(ranks, Number(acc[0].xp)).level < Number(r.min_rank)) throw new AppError("rank_too_low");

    const [mine] = await conn.query<RowDataPacket[]>("SELECT tickets FROM raffle_entries WHERE raffle_id = ? AND account_id = ? FOR UPDATE", [raffleId, accountId]);
    const held = Number(mine[0]?.tickets ?? 0);
    if (held + count > Number(r.max_tickets)) throw new AppError("max_tickets");

    const cost = Number(r.cost) * count;
    if (cost > 0) await applyPoints(conn, accountId, -cost, "raffle", `${count}× ticket: ${r.title}`, raffleId);
    await conn.query(
      "INSERT INTO raffle_entries (raffle_id, account_id, tickets) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tickets = tickets + VALUES(tickets)",
      [raffleId, accountId, count]
    );
  });
}

// ── admin ────────────────────────────────────────────────────────────────
export interface RaffleInput { title: string; prize: string; cost: number; max_tickets: number; min_rank: number; winners: number; ends_at: string }

export async function createRaffle(v: RaffleInput): Promise<number> {
  const seed = generateServerSeed();
  const [res] = await getPool().query<ResultSetHeader>(
    `INSERT INTO raffles (title, prize, cost, max_tickets, min_rank, winners, ends_at, server_seed, server_seed_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [v.title, v.prize, v.cost, v.max_tickets, v.min_rank, v.winners, v.ends_at, seed, sha256(seed)]
  );
  return res.insertId;
}

/** Draw after the end. Repeat winners are skipped (one prize per account). */
export async function drawRaffle(raffleId: number): Promise<{ place: number; display_name: string }[]> {
  return withTx(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, winners, status, server_seed, ends_at <= UTC_TIMESTAMP() AS ended FROM raffles WHERE id = ? FOR UPDATE", [raffleId]);
    const r = rows[0];
    if (!r) throw new AppError("not_found");
    if (r.status !== "open") throw new AppError("already_drawn");
    if (!Number(r.ended)) throw new AppError("not_ended");

    const [entries] = await conn.query<RowDataPacket[]>(
      `SELECT e.account_id, e.tickets, a.display_name FROM raffle_entries e JOIN user_accounts a ON a.id = e.account_id
        WHERE e.raffle_id = ? ORDER BY e.created_at, e.account_id`, [raffleId]);
    const lines: string[] = [];
    const owners: { id: number; name: string }[] = [];
    for (const e of entries) {
      for (let i = 0; i < Number(e.tickets); i++) {
        lines.push(`${e.account_id}:${e.display_name}`);
        owners.push({ id: Number(e.account_id), name: String(e.display_name) });
      }
    }
    if (!lines.length) throw new AppError("no_entries");

    const hash = entriesHash(lines);
    const want = Math.min(Number(r.winners), entries.length);
    const won = new Set<number>();
    const results: { place: number; display_name: string; account_id: number; ticket_index: number }[] = [];
    for (let nonce = 0; results.length < want && nonce < want * 1000; nonce++) {
      const idx = winnerIndex(String(r.server_seed), hash, nonce, lines.length);
      const owner = owners[idx];
      if (won.has(owner.id)) continue;
      won.add(owner.id);
      results.push({ place: results.length + 1, display_name: owner.name, account_id: owner.id, ticket_index: idx });
    }
    for (const w of results) {
      await conn.query("INSERT INTO raffle_winners (raffle_id, place, account_id, display_name, ticket_index) VALUES (?, ?, ?, ?, ?)",
        [raffleId, w.place, w.account_id, w.display_name, w.ticket_index]);
    }
    await conn.query(
      "UPDATE raffles SET status = 'drawn', entries_hash = ?, tickets_snapshot = ?, drawn_at = UTC_TIMESTAMP() WHERE id = ?",
      [hash, lines.join("\n"), raffleId]);
    return results.map(({ place, display_name }) => ({ place, display_name }));
  });
}

/** Cancel an open raffle and refund every ticket. */
export async function cancelRaffle(raffleId: number): Promise<void> {
  await withTx(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT title, cost, status FROM raffles WHERE id = ? FOR UPDATE", [raffleId]);
    const r = rows[0];
    if (!r) throw new AppError("not_found");
    if (r.status !== "open") throw new AppError("already_drawn");
    const [entries] = await conn.query<RowDataPacket[]>("SELECT account_id, tickets FROM raffle_entries WHERE raffle_id = ?", [raffleId]);
    for (const e of entries) {
      const refund = Number(r.cost) * Number(e.tickets);
      if (refund > 0) await applyPoints(conn, Number(e.account_id), refund, "refund", `Raffle cancelled: ${r.title}`, raffleId);
    }
    await conn.query("UPDATE raffles SET status = 'cancelled' WHERE id = ?", [raffleId]);
  });
}

export async function deleteRaffle(raffleId: number): Promise<void> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT status FROM raffles WHERE id = ?", [raffleId]);
  if (rows[0]?.status === "open") throw new AppError("invalid_input", "cancel it first so tickets are refunded");
  await getPool().query("DELETE FROM raffles WHERE id = ?", [raffleId]);
}
