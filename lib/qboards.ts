import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { fetchQboardsSnapshot, type QboardsSnapshot } from "./qboardsFeed";
import { maskUsername } from "./mask";
import type { Board } from "./leaderboard";

export async function syncQboards() {
  // Fetch and validate every page before atomically replacing the snapshot.
  // A failed fetch leaves the last successful leaderboard intact.
  const snapshot = await fetchQboardsSnapshot();
  await getPool().query(
    `INSERT INTO qboards_snapshots (event_id, snapshot, synced_at) VALUES (?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE snapshot = VALUES(snapshot), synced_at = VALUES(synced_at)`,
    [snapshot.eventId, JSON.stringify(snapshot)],
  );
  return { eventId: snapshot.eventId, players: snapshot.rows.length, metric: "points" };
}

export async function getQboardsBoard(limit: number): Promise<Board | null> {
  const [records] = await getPool().query<RowDataPacket[]>(
    "SELECT snapshot, synced_at FROM qboards_snapshots ORDER BY synced_at DESC, event_id DESC LIMIT 1",
  );
  const record = records[0];
  if (!record) return null;
  const snapshot: QboardsSnapshot = typeof record.snapshot === "string" ? JSON.parse(record.snapshot) : record.snapshot;
  if (snapshot.usePoints !== true) return null;
  const now = Date.now();
  return {
    source: "qboards", scoreKind: "points", syncedAt: String(record.synced_at),
    syncDelayed: now - Date.parse(String(record.synced_at).replace(" ", "T") + "Z") > 9 * 60 * 60 * 1000,
    period: {
      id: 0, title: snapshot.title,
      starts_at: snapshot.startsAt.slice(0, 19).replace("T", " "),
      ends_at: snapshot.endsAt.slice(0, 19).replace("T", " "), prize_pool: snapshot.prizePool,
      state: now < Date.parse(snapshot.startsAt) ? "upcoming" : now < Date.parse(snapshot.endsAt) ? "live" : "ended",
    },
    rows: snapshot.rows.slice(0, limit).map((r) => ({ rank: r.rank, name: maskUsername(r.username), wagered: r.score, prize: r.prize })),
    prizes: snapshot.rows.filter((r) => r.prize != null).map((r) => ({ place: r.rank, amount: r.prize! })),
    previous: [],
  };
}
