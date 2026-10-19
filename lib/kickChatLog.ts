import "server-only";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

// Rolling log of chat messages delivered by the Kick webhook (see migration
// 0007). The table is also created on first use so a deploy works before the
// migration has been run.

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  ready ??= getPool().query(`CREATE TABLE IF NOT EXISTS kick_chat_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    content VARCHAR(500) NOT NULL,
    outcome VARCHAR(40) NULL,
    slot VARCHAR(191) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kick_chat_created (created_at)
  ) ENGINE=InnoDB`).then(() => undefined, (e) => { ready = null; throw e; });
  return ready;
}

export async function logChat(username: string, content: string, outcome: string | null = null, slot: string | null = null): Promise<void> {
  await ensureTable();
  await getPool().query("INSERT INTO kick_chat_log (username, content, outcome, slot, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())",
    [username.slice(0, 191), content.slice(0, 500), outcome, slot?.slice(0, 191) ?? null]);
  // keep it small
  if (Math.random() < 0.05) await getPool().query("DELETE FROM kick_chat_log WHERE created_at < UTC_TIMESTAMP() - INTERVAL 2 DAY");
}

export interface ChatLogRow { username: string; content: string; outcome: string | null; slot: string | null; at: string }

export async function recentChat(): Promise<{ last: ChatLogRow | null; joins: ChatLogRow[] }> {
  await ensureTable();
  const pool = getPool();
  const cols = "username, content, outcome, slot, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS at";
  const [[last], [joins]] = await Promise.all([
    pool.query<RowDataPacket[]>(`SELECT ${cols} FROM kick_chat_log ORDER BY id DESC LIMIT 1`),
    pool.query<RowDataPacket[]>(`SELECT ${cols} FROM kick_chat_log WHERE outcome IS NOT NULL ORDER BY id DESC LIMIT 30`),
  ]);
  return { last: (last[0] as ChatLogRow) ?? null, joins: joins as ChatLogRow[] };
}
