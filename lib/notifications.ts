import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { getLiveStatus } from "./stream";

// Bell feed: what's happening on the site right now (live stream, open
// tournament registration, running hunt, open raffles, live leaderboard) plus,
// for a signed-in viewer, updates on their own redemptions and claims.

export interface Note { id: string; kind: "live" | "event" | "personal"; title: string; body: string; href: string; at: string }

export async function getNotifications(accountId: number | null): Promise<Note[]> {
  const pool = getPool();
  const notes: Note[] = [];
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const safe = async <T,>(fn: () => Promise<T>, fallback: T) => { try { return await fn(); } catch { return fallback; } };

  const [live, ko, hunt, raffles, period] = await Promise.all([
    getLiveStatus(),
    safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, title, status, max_players, COALESCE(opened_at, created_at) AS at FROM ko_tournaments WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"))[0][0], undefined),
    safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, title, status, created_at FROM bonus_hunts WHERE status <> 'finished' ORDER BY id DESC LIMIT 1"))[0][0], undefined),
    safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, title, prize, created_at FROM raffles WHERE status = 'open' AND ends_at > UTC_TIMESTAMP() ORDER BY ends_at LIMIT 3"))[0], [] as RowDataPacket[]),
    safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, title, prize_pool, starts_at FROM lb_periods WHERE UTC_TIMESTAMP() BETWEEN starts_at AND ends_at LIMIT 1"))[0][0], undefined),
  ]);

  if (live.live) notes.push({ id: "live", kind: "live", title: "Ravo is live on Kick", body: live.title || "Come hang out in chat.", href: "/stream", at: now });
  if (ko) notes.push({
    id: `ko-${ko.id}-${ko.status}`, kind: "event",
    title: ko.status === "open" ? `Tournament open: ${ko.title}` : `Tournament running: ${ko.title}`,
    body: ko.status === "open" ? `Type !join in Kick chat to grab one of ${ko.max_players} seats.` : "Follow the 1v1 battles live.",
    href: "/tournaments", at: String(ko.at),
  });
  if (hunt) notes.push({ id: `hunt-${hunt.id}-${hunt.status}`, kind: "event", title: `Bonus hunt ${hunt.status === "opening" ? "opening now" : "collecting"}`, body: String(hunt.title), href: "/bonus-hunts", at: String(hunt.created_at) });
  for (const r of raffles) notes.push({ id: `raffle-${r.id}`, kind: "event", title: `Raffle: ${r.title}`, body: `Win ${r.prize}. Tickets cost points.`, href: "/raffles", at: String(r.created_at) });
  if (period) notes.push({ id: `period-${period.id}`, kind: "event", title: period.title, body: `$${Number(period.prize_pool).toLocaleString("en-US")} on the line this month.`, href: "/leaderboard", at: String(period.starts_at) });

  if (accountId != null) {
    const [red, claims] = await Promise.all([
      safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, item_name, status, admin_note, updated_at FROM store_redemptions WHERE account_id = ? ORDER BY updated_at DESC LIMIT 5", [accountId]))[0], [] as RowDataPacket[]),
      safe(async () => (await pool.query<RowDataPacket[]>("SELECT id, milestone_name, reward, status, admin_note, updated_at FROM milestone_claims WHERE account_id = ? ORDER BY updated_at DESC LIMIT 5", [accountId]))[0], [] as RowDataPacket[]),
    ]);
    for (const r of red) notes.push({
      id: `red-${r.id}-${r.status}`, kind: "personal",
      title: r.status === "fulfilled" ? `Paid: ${r.item_name}` : r.status === "rejected" ? `Refunded: ${r.item_name}` : `Redeemed: ${r.item_name}`,
      body: r.admin_note ? String(r.admin_note) : r.status === "pending" ? "The team is on it." : "",
      href: "/store", at: String(r.updated_at),
    });
    for (const c of claims) notes.push({
      id: `claim-${c.id}-${c.status}`, kind: "personal",
      title: c.status === "paid" ? `Milestone paid: ${c.milestone_name}` : c.status === "rejected" ? `Milestone claim rejected: ${c.milestone_name}` : `Milestone claimed: ${c.milestone_name}`,
      body: c.admin_note ? String(c.admin_note) : `$${Number(c.reward).toLocaleString("en-US")} reward`,
      href: "/milestones", at: String(c.updated_at),
    });
  }
  return notes.sort((a, b) => (a.kind === "live" ? -1 : b.kind === "live" ? 1 : b.at.localeCompare(a.at))).slice(0, 12);
}
