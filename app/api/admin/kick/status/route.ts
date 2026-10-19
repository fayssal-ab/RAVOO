import { isAdminSession } from "@/lib/admin";
import { json, jsonError } from "@/lib/http";
import { ensureChatSubscription } from "@/lib/kickApi";
import { recentChat } from "@/lib/kickChatLog";

// Dashboard poll: is the Kick chat webhook subscribed (re-subscribes if Kick
// dropped it), last chat message received, and recent !join outcomes.
export const dynamic = "force-dynamic";

let checked: { at: number; ok: boolean; error: string | null } | null = null;

export async function GET() {
  if (!(await isAdminSession())) return jsonError("unauthorized", 401);
  if (!checked || Date.now() - checked.at > 60_000) {
    checked = await ensureChatSubscription()
      .then(() => ({ at: Date.now(), ok: true, error: null }))
      .catch((e: Error) => ({ at: Date.now(), ok: false, error: e.message }));
  }
  const chat = await recentChat().catch(() => ({ last: null, joins: [] }));
  return json({ ok: true, subscribed: checked.ok, error: checked.error, ...chat });
}
