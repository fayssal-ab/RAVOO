import { isAdminSession } from "@/lib/admin";
import { KICK_CHANNEL } from "@/lib/constants";
import { json, jsonError } from "@/lib/http";
import { KICK_PUSHER, resolveChatroomId } from "@/lib/kickChat";

// Public Kick chat socket parameters for the dashboard's !join reader.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminSession())) return jsonError("unauthorized", 401);
  const chatroomId = await resolveChatroomId();
  if (!chatroomId) return json({ ok: false, reason: "chatroom_unresolved", channel: KICK_CHANNEL });
  return json({ ok: true, channel: KICK_CHANNEL, wsUrl: KICK_PUSHER.wsUrl, socketChannel: KICK_PUSHER.channel(chatroomId), chatEvent: KICK_PUSHER.chatEvent });
}
