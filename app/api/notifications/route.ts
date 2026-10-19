import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";
import { currentAccountId } from "@/lib/userAuth";

// Bell feed for the navbar (public events + the viewer's own updates).
export const dynamic = "force-dynamic";

export async function GET() {
  const accountId = await currentAccountId().catch(() => null);
  try {
    return NextResponse.json({ ok: true, notes: await getNotifications(accountId) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, notes: [] }, { status: 503 });
  }
}
