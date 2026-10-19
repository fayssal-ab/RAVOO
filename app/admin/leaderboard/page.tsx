import Link from "next/link";
import { AdminTitle, Card, Field, toLocalInput } from "@/components/admin/ui";
import { Flash } from "@/components/ui/bits";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { adminEntries, getBoard, listPeriods } from "@/lib/leaderboard";
import { deletePeriodAction, importEntriesAction, removeEntryAction, savePeriodAction } from "../actions";

const STATE_CLS = { live: "text-neon", upcoming: "text-gold", ended: "text-dim" } as const;

export default async function AdminLeaderboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const periods = await listPeriods();
  const selected = periods.find((p) => String(p.id) === sp.period) ?? periods.find((p) => p.state === "live") ?? periods[0] ?? null;
  const editing = sp.edit ? periods.find((p) => String(p.id) === sp.edit) ?? null : null;
  const [entries, board] = selected ? await Promise.all([adminEntries(selected.id), getBoard(selected.id)]) : [[], null];
  const prizeByPlace = new Map((board?.prizes ?? []).map((p) => [p.place, p.amount]));
  // same order as the public board (ties: first recorded wins), one place each
  const places = entries.map((_, i) => i + 1);
  const editPrizes = editing ? (await getBoard(editing.id)).prizes.map((p) => Number(p.amount)).join(", ") : "";

  return (
    <>
      <AdminTitle title="Leaderboard">
        No casino feed yet: create a period, then paste wagers exported from your Qzino affiliate dashboard. All times are UTC.
      </AdminTitle>
      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card title={editing ? `Edit: ${editing.title}` : "New period"}>
          <form action={savePeriodAction} className="space-y-4">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Field label="Title"><input name="title" required maxLength={120} defaultValue={editing?.title ?? ""} placeholder="October $5,000 Leaderboard" className="field" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (UTC)"><input type="datetime-local" name="starts_at" required defaultValue={editing ? toLocalInput(editing.starts_at) : ""} className="field" /></Field>
              <Field label="Ends (UTC)"><input type="datetime-local" name="ends_at" required defaultValue={editing ? toLocalInput(editing.ends_at) : ""} className="field" /></Field>
            </div>
            <Field label="Prizes by place ($)" hint="1st, 2nd, 3rd… separated by commas. The pool is their sum.">
              <input name="prizes" defaultValue={editPrizes} placeholder="2000, 1000, 500, 250, 100" className="field font-mono" />
            </Field>
            <div className="flex gap-2">
              <button className="btn btn-neon btn-sm">{editing ? "Save changes" : "Create period"}</button>
              {editing && <Link href="/admin/leaderboard" className="btn btn-ghost btn-sm">Cancel</Link>}
            </div>
          </form>
        </Card>

        <Card title="Periods">
          {periods.length === 0 ? (
            <p className="text-sm text-muted">No periods yet. The public page shows an empty state until you create one.</p>
          ) : (
            <ul className="divide-y divide-line">
              {periods.map((p) => (
                <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 py-3 ${selected?.id === p.id ? "text-text" : "text-muted"}`}>
                  <Link href={`/admin/leaderboard?period=${p.id}`} className="min-w-0 hover:text-neon">
                    <span className="font-bold">{p.title}</span>
                    <span className={`ml-2 text-xs font-bold uppercase ${STATE_CLS[p.state]}`}>{p.state}</span>
                    <span className="block text-xs text-dim">{p.starts_at} → {p.ends_at} · ${Number(p.prize_pool).toLocaleString("en-US")}</span>
                  </Link>
                  <span className="flex gap-2">
                    <Link href={`/admin/leaderboard?edit=${p.id}&period=${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                    <form action={deletePeriodAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className="btn btn-ghost btn-sm !text-danger" danger title="Delete period?" confirmLabel="Delete" body={<>Deletes <b>{p.title}</b> with its prizes and all wagers.</>}>Delete</ConfirmButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {selected && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Card title={`Import wagers · ${selected.title}`}>
            <form action={importEntriesAction} className="space-y-4">
              <input type="hidden" name="period" value={selected.id} />
              <Field label="CSV" hint="One player per line: username,wagered. A header line is skipped. Existing names are updated.">
                <textarea name="csv" required rows={9} placeholder={"username,wagered\nsleepyhead,15230.50\nnightowl,9120"} className="field font-mono text-xs" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="replace" className="accent-[var(--color-neon)]" /> Replace all current entries</label>
              <button className="btn btn-neon btn-sm">Import</button>
            </form>
          </Card>
          <Card title={`Entries (${entries.length})`}>
            {entries.length === 0 ? (
              <p className="text-sm text-muted">No wagers yet.</p>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-dim"><tr><th className="py-2">#</th><th>Username</th><th className="text-right">Wagered</th><th className="text-right">Prize</th><th /></tr></thead>
                  <tbody>
                    {entries.map((e, i) => {
                      const place = places[i];
                      const prize = Number(e.wagered) > 0 ? prizeByPlace.get(place) : undefined;
                      return (
                        <tr key={e.username} className="border-t border-line">
                          <td className="py-2 font-mono text-dim">{place}</td>
                          <td className="font-bold">{e.username}</td>
                          <td className="text-right font-mono">${Number(e.wagered).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="text-right font-mono text-neon">{prize ? `$${Number(prize).toLocaleString("en-US")}` : ""}</td>
                          <td className="text-right">
                            <form action={removeEntryAction}>
                              <input type="hidden" name="period" value={selected.id} />
                              <input type="hidden" name="username" value={e.username} />
                              <button className="px-2 text-xs text-dim hover:text-danger" aria-label={`Remove ${e.username}`}>✕</button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
