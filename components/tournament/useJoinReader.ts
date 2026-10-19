"use client";

import { useEffect, useRef, useState } from "react";

// `!join` arrives server-side through Kick's official chat webhook
// (/api/kick/webhook). This hook only polls the webhook status and the
// recent join log for the dashboard; the dashboard can be closed without
// losing registrations.

export type ReaderStatus = "off" | "connecting" | "live" | "error";
export interface JoinEvent { at: number; username: string; outcome: string; slot?: string }

interface StatusResponse {
  ok: boolean; subscribed: boolean; error: string | null;
  last: { username: string; at: string } | null;
  joins: { username: string; outcome: string | null; slot: string | null; at: string }[];
}

export function useJoinReader(enabled: boolean, onJoin?: () => void) {
  const [status, setStatus] = useState<ReaderStatus>(enabled ? "connecting" : "off");
  const [events, setEvents] = useState<JoinEvent[]>([]);
  const [lastSeen, setLastSeen] = useState<{ at: number; username: string } | null>(null);
  const cb = useRef(onJoin);
  useEffect(() => { cb.current = onJoin; }, [onJoin]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let newest = "";
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/kick/status", { cache: "no-store" });
        const d = (await res.json()) as StatusResponse;
        if (stopped) return;
        setStatus(d.ok && d.subscribed ? "live" : "error");
        setLastSeen(d.last ? { at: Date.parse(d.last.at), username: d.last.username } : null);
        setEvents(d.joins.map((j) => ({ at: Date.parse(j.at), username: j.username, outcome: j.outcome ?? "", slot: j.slot ?? undefined })));
        const top = d.joins[0] ? `${d.joins[0].at}|${d.joins[0].username}` : "";
        if (newest && top !== newest) cb.current?.();
        newest = top;
      } catch {
        if (!stopped) setStatus("error");
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => { stopped = true; clearInterval(id); setStatus("off"); };
  }, [enabled]);

  return { status, events, lastSeen };
}
