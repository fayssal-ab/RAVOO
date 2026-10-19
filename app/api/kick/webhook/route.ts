import { json, jsonError } from "@/lib/http";
import { verifyKickWebhook } from "@/lib/kickApi";
import { JOIN_RE, recordJoin } from "@/lib/knockout";
import { findSlotByName } from "@/lib/slots";
import { withTx } from "@/lib/tx";

// Kick event webhook (official API). Every chat message of Ravo's channel
// lands here; `!join` / `!join <slot>` registers the sender in the open
// tournament. Same message-id key as the dashboard socket relay, so a message
// seen by both is recorded once.
export const dynamic = "force-dynamic";

interface ChatEvent { message_id?: string; content?: string; sender?: { user_id?: number; username?: string } }

export async function POST(request: Request) {
  const body = await request.text();
  if (!(await verifyKickWebhook(request.headers, body).catch(() => false))) return jsonError("bad_signature", 401);
  if (request.headers.get("kick-event-type") !== "chat.message.sent") return json({ ok: true });
  let e: ChatEvent;
  try { e = JSON.parse(body); } catch { return jsonError("invalid_body", 400); }
  if (!e.content || !JOIN_RE.test(e.content) || !e.message_id || e.sender?.user_id == null || !e.sender.username) return json({ ok: true });
  try {
    const slot = await findSlotByName(e.content.replace(/^\s*!join/i, ""));
    const result = await withTx((conn) => recordJoin(conn, {
      kickUserId: String(e.sender!.user_id), username: e.sender!.username!, messageId: `kick:${e.message_id}`, slot,
    }));
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("kick webhook join failed", err instanceof Error ? err.message : "unknown");
    return jsonError("processing_failed", 500);
  }
}
