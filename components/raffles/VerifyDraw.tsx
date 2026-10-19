"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";

// Re-runs the draw in the browser with Web Crypto (same math as lib/fair.ts):
// seed hash, entries hash, then HMAC per nonce, skipping repeat winners.
const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (s: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

export function VerifyDraw({ seed, seedHash, entriesHash, tickets, winners }: {
  seed: string; seedHash: string; entriesHash: string; tickets: string[]; winners: { place: number; ticket_index: number }[];
}) {
  const [result, setResult] = useState<null | { ok: boolean; lines: string[] }>(null);

  async function verify() {
    const lines: string[] = [];
    const h = await sha256(seed);
    const seedOk = h === seedHash;
    lines.push(`${seedOk ? "✓" : "✗"} SHA256(seed) matches the hash published before the raffle`);
    const eh = await sha256(tickets.map((t) => t.toLowerCase()).join("\n"));
    const entriesOk = eh === entriesHash;
    lines.push(`${entriesOk ? "✓" : "✗"} SHA256(ticket list) = entries hash (${tickets.length} tickets)`);
    const owner = (i: number) => tickets[i].split(":")[0];
    const won = new Set<string>();
    const picked: number[] = [];
    for (let nonce = 0; picked.length < winners.length && nonce < winners.length * 1000; nonce++) {
      const idx = parseInt((await hmac(seed, `${eh}:${nonce}`)).slice(0, 13), 16) % tickets.length;
      if (won.has(owner(idx))) continue;
      won.add(owner(idx));
      picked.push(idx);
    }
    const drawOk = winners.every((w, i) => picked[i] === w.ticket_index);
    lines.push(`${drawOk ? "✓" : "✗"} Recomputed winning tickets: ${picked.map((i) => `#${i}`).join(", ")}`);
    setResult({ ok: seedOk && entriesOk && drawOk, lines });
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={verify} className="btn btn-ghost btn-sm"><ShieldCheck className="size-4" /> Verify in my browser</button>
      {result && (
        <div className={`mt-3 rounded-xl border p-3 font-mono text-xs leading-relaxed ${result.ok ? "border-neon/50 bg-neon/5 text-neon" : "border-danger/50 bg-danger/5 text-danger"}`}>
          <p className="mb-1 flex items-center gap-2 font-head text-sm font-bold">
            {result.ok ? <ShieldCheck className="size-4" /> : <ShieldX className="size-4" />} {result.ok ? "Draw verified" : "Verification failed"}
          </p>
          {result.lines.map((l) => <p key={l}>{l}</p>)}
        </div>
      )}
    </div>
  );
}
