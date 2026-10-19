import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "./db";
import { KICK_CHANNEL } from "./constants";

// Kick live status (public channel endpoint, server-side only, cached 60s)
// and the weekly schedule.

export interface LiveStatus { live: boolean; title: string; viewers: number; followers: number }

export async function getLiveStatus(): Promise<LiveStatus> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_CHANNEL}`, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; ravoneversleeps-site)" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { followers_count?: number; livestream?: { session_title?: string; viewer_count?: number } | null };
    return {
      live: Boolean(j.livestream),
      title: String(j.livestream?.session_title ?? "").slice(0, 140),
      viewers: Number(j.livestream?.viewer_count ?? 0),
      followers: Number(j.followers_count ?? 0),
    };
  } catch {
    return { live: false, title: "", viewers: 0, followers: 0 };
  }
}

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export interface Slot { id: number; weekday: number; start_time: string; title: string }

export async function getSchedule(): Promise<Slot[]> {
  try {
    const [rows] = await getPool().query<RowDataPacket[]>("SELECT id, weekday, TIME_FORMAT(start_time, '%H:%i') AS t, title FROM stream_schedule ORDER BY weekday, start_time");
    return rows.map((r) => ({ id: Number(r.id), weekday: Number(r.weekday), start_time: String(r.t), title: String(r.title) }));
  } catch {
    return [];
  }
}

export async function addSlot(weekday: number, startTime: string, title: string): Promise<void> {
  await getPool().query("INSERT INTO stream_schedule (weekday, start_time, title) VALUES (?, ?, ?)", [weekday, startTime, title]);
}
export async function deleteSlot(id: number): Promise<void> {
  await getPool().query("DELETE FROM stream_schedule WHERE id = ?", [id]);
}
