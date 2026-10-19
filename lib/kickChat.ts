import "server-only";
import { KICK_CHANNEL } from "./constants";

// Kick chat socket parameters (UNOFFICIAL: Kick publishes no chat API; read
// from the public web client, ported from ONO). The chatroom id of Ravo's
// channel is stable: KICK_CHATROOM_ID overrides the lookup.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
let cached: { id: number; at: number } | null = null;

export async function resolveChatroomId(): Promise<number | null> {
  const envId = Number(process.env.KICK_CHATROOM_ID);
  if (Number.isInteger(envId) && envId > 0) return envId;
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.id;
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_CHANNEL}`, {
      headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const id = ((await res.json()) as { chatroom?: { id?: number } }).chatroom?.id;
    if (!id) return null;
    cached = { id, at: Date.now() };
    return id;
  } catch {
    return null;
  }
}

/** Public Pusher constants from Kick's web client. One place to update if Kick changes them. */
export const KICK_PUSHER = {
  wsUrl: "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false",
  channel: (chatroomId: number) => `chatrooms.${chatroomId}.v2`,
  chatEvent: "App\\Events\\ChatMessageEvent",
} as const;
