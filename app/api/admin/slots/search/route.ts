import { isAdminSession } from "@/lib/admin";
import { json, jsonError } from "@/lib/http";
import { searchCatalog } from "@/lib/slots";

// Admin-only fuzzy slot search (hunt bonuses, manual tournament players).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminSession())) return jsonError("unauthorized", 401);
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  try {
    return json({ results: await searchCatalog(q) });
  } catch {
    return json({ results: [], error: "catalog_unavailable" });
  }
}
