import { isCronAuthorized, json, jsonError } from "@/lib/http";
import { syncQboards } from "@/lib/qboards";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function handle(request: Request) {
  if (!isCronAuthorized(request)) return jsonError("unauthorized", 401);
  try {
    return json({ ok: true, synced: await syncQboards() });
  } catch (err) {
    console.error("cron/leaderboard failed", err instanceof Error ? err.message : "unknown");
    return jsonError("leaderboard_sync_failed", 500);
  }
}

export const GET = handle;
export const POST = handle;
