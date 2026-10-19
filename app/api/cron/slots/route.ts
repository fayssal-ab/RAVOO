import { isCronAuthorized, json, jsonError } from "@/lib/http";
import { catalogIsStale, syncCatalog, upgradeTypedSlots } from "@/lib/slots";

// Keeps the slot catalogue fresh: re-synced when older than a day.
// Call with `Authorization: Bearer $CRON_SECRET`.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function handle(request: Request) {
  if (!isCronAuthorized(request)) return jsonError("unauthorized", 401);
  try {
    const synced = (await catalogIsStale()) ? await syncCatalog() : null;
    return json({ ok: true, synced, upgraded: synced ? await upgradeTypedSlots() : 0 });
  } catch (err) {
    console.error("cron/slots failed", err instanceof Error ? err.message : "unknown");
    return jsonError("slots_sync_failed", 500);
  }
}

export const GET = handle;
export const POST = handle;
