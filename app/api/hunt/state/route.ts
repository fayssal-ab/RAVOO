import { NextResponse } from "next/server";
import { getHunt } from "@/lib/hunts";

// Public state of the running (else latest) bonus hunt, for the OBS overlay.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, hunt: await getHunt() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
