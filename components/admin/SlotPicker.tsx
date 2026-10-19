"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SlotArt } from "@/components/ui/SlotArt";

interface Slot { id: string; name: string; provider: string; imageUrl: string | null }

/**
 * Catalogue search with art. Writes hidden `slot_id` (catalogue pick) and a
 * visible `slot` text (fallback when the slot isn't in the catalogue).
 */
export function SlotPicker({ nameField = "slot", idField = "slot_id", providerField = "provider", placeholder = "Search a slot…" }: {
  nameField?: string; idField?: string; providerField?: string; placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Slot[]>([]);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (picked || q.trim().length < 2) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/slots/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const data = (await res.json()) as { results: Slot[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 180);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, picked]);

  return (
    <div className="relative">
      <input type="hidden" name={idField} value={picked?.id ?? ""} />
      <input type="hidden" name={providerField} value={picked?.provider ?? ""} />
      {picked ? (
        <div className="flex items-center gap-3 rounded-xl border border-neon/50 bg-neon/5 p-2">
          <SlotArt name={picked.name} src={picked.imageUrl} size={40} rounded="rounded-lg" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{picked.name}</span>
            <span className="block truncate text-xs text-dim">{picked.provider}</span>
          </span>
          <input type="hidden" name={nameField} value={picked.name} />
          <button type="button" onClick={() => { setPicked(null); setQ(""); }} className="grid size-8 place-items-center rounded-lg text-dim hover:text-text" aria-label="Change slot"><X className="size-4" /></button>
        </div>
      ) : (
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input
            name={nameField}
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) { setResults([]); setOpen(false); } }}
            onFocus={() => results.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            autoComplete="off"
            maxLength={120}
            className="field !pl-9"
          />
        </label>
      )}
      {open && !picked && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-line-hot bg-bg-2 p-1 shadow-2xl">
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setPicked(r); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left hover:bg-surface-3">
                <SlotArt name={r.name} src={r.imageUrl} size={36} rounded="rounded-md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block truncate text-xs text-dim">{r.provider}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
