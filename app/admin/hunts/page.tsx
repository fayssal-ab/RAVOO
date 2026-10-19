import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, MonitorPlay, X } from "lucide-react";
import { SlotPicker } from "@/components/admin/SlotPicker";
import { AdminTitle, Card, Field } from "@/components/admin/ui";
import { Flash } from "@/components/ui/bits";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { SlotArt } from "@/components/ui/SlotArt";
import { getHunt, listHunts } from "@/lib/hunts";
import { formatMoney } from "@/lib/money";
import { ensureCatalog } from "@/lib/slots";
import { addBonusAction, bonusOpAction, createHuntAction, huntStatusAction, updateHuntAction } from "../actions";

const STATUS = { collecting: "Collecting", opening: "Opening", finished: "Finished" } as const;

export default async function AdminHunts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  await ensureCatalog();
  const [hunts, hunt] = await Promise.all([listHunts(), getHunt(sp.h && /^\d+$/.test(sp.h) ? Number(sp.h) : undefined)]);
  const running = hunts.find((h) => h.status !== "finished");
  const editable = hunt?.status === "collecting";

  return (
    <>
      <AdminTitle title="Bonus hunts">
        Add bonuses from the slot catalogue (art + provider come with it), then enter each win as it opens. The first win locks the list; wins can still be corrected.
      </AdminTitle>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/overlay/bonus-hunt" target="_blank" className="btn btn-ghost btn-sm"><MonitorPlay className="size-4" /> OBS overlay</Link>
        <Link href="/bonus-hunts" target="_blank" className="btn btn-ghost btn-sm"><ExternalLink className="size-4" /> Public page</Link>
      </div>
      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} />

      <div className="grid gap-6 xl:grid-cols-[18rem_1fr]">
        <div className="space-y-6">
          {!running && (
            <Card title="New hunt">
              <form action={createHuntAction} className="space-y-4">
                <Field label="Title"><input name="title" required maxLength={120} placeholder="2k late-night hunt" className="field" /></Field>
                <Field label="Starting balance ($)"><input name="start_balance" required inputMode="decimal" placeholder="2000" className="field font-mono" /></Field>
                <button className="btn btn-neon btn-sm">Create</button>
              </form>
            </Card>
          )}
          <Card title="Hunts">
            {hunts.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
              <ul className="space-y-1 text-sm">
                {hunts.map((h) => (
                  <li key={h.id}>
                    <Link href={`/admin/hunts?h=${h.id}`} className={`flex justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2 ${hunt?.id === h.id ? "bg-neon/10 text-neon" : "text-muted"}`}>
                      <span className="truncate">{h.title}</span><span className="shrink-0 text-xs">{STATUS[h.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {hunt && (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{STATUS[hunt.status]}</p>
                <h2 className="mt-1 font-display text-3xl"><span className="chrome">{hunt.title}</span></h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {hunt.status !== "finished" && (
                  <form action={huntStatusAction}>
                    <input type="hidden" name="id" value={hunt.id} /><input type="hidden" name="op" value="finish" />
                    <ConfirmButton className="btn btn-neon btn-sm" title="Finish hunt?" confirmLabel="Finish" body="Every bonus must be opened. The result becomes final on the public page.">Finish hunt</ConfirmButton>
                  </form>
                )}
                {hunt.status === "finished" && (
                  <form action={huntStatusAction}>
                    <input type="hidden" name="id" value={hunt.id} /><input type="hidden" name="op" value="reopen" />
                    <button className="btn btn-ghost btn-sm">Reopen</button>
                  </form>
                )}
                <form action={huntStatusAction}>
                  <input type="hidden" name="id" value={hunt.id} /><input type="hidden" name="op" value="delete" />
                  <ConfirmButton className="btn btn-ghost btn-sm !text-danger" danger title="Delete hunt?" confirmLabel="Delete" body="Removes the hunt and all its bonuses.">Delete</ConfirmButton>
                </form>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Start", formatMoney(hunt.start_balance)], ["Won", formatMoney(hunt.stats.won)],
                ["Opened", `${hunt.stats.opened}/${hunt.stats.count}`], ["Break-even", hunt.stats.req_multi != null ? `${hunt.stats.req_multi}x` : "–"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-line bg-bg-2 px-3 py-2">
                  <p className="text-[0.65rem] uppercase tracking-widest text-dim">{l}</p>
                  <p className="font-mono font-bold text-neon">{v}</p>
                </div>
              ))}
            </div>

            <form action={updateHuntAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
              <input type="hidden" name="id" value={hunt.id} />
              <Field label="Title"><input name="title" defaultValue={hunt.title} maxLength={120} className="field" /></Field>
              <Field label="Start ($)" hint={editable ? undefined : "locked"}><input name="start_balance" defaultValue={Number(hunt.start_balance)} readOnly={!editable} className="field font-mono" /></Field>
              <button className="btn btn-ghost btn-sm">Save</button>
            </form>

            {editable && (
              <form action={addBonusAction} className="mt-6 grid gap-2 rounded-2xl border border-line bg-bg-2 p-3 md:grid-cols-[1fr_9rem_7rem_auto] md:items-start">
                <input type="hidden" name="hunt" value={hunt.id} />
                <SlotPicker />
                <input name="called_by" maxLength={64} placeholder="Called by (optional)" className="field" />
                <input name="bet" required inputMode="decimal" placeholder="Bet $" className="field font-mono" />
                <button className="btn btn-neon btn-sm h-[42px]">Add bonus</button>
              </form>
            )}

            <ol className="mt-5 space-y-2">
              {hunt.bonuses.map((b, i) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg-2 p-2">
                  <span className="w-6 text-center font-mono text-xs text-dim">{i + 1}</span>
                  <SlotArt name={b.slot} src={b.image_url} size={44} rounded="rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{b.slot}</span>
                    <span className="block truncate text-xs text-dim">{b.provider}{b.called_by && ` · ${b.called_by}`} · bet {formatMoney(b.bet)}{b.multi != null && <span className="text-neon"> · {b.multi}x</span>}</span>
                  </span>
                  <form action={bonusOpAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="hunt" value={hunt.id} />
                    <input type="hidden" name="id" value={b.id} />
                    {hunt.status !== "finished" && (
                      <>
                        <input name="win" defaultValue={b.win != null ? Number(b.win) : ""} inputMode="decimal" placeholder="win $" className="field !w-24 !py-1.5 font-mono text-xs" aria-label={`Win for ${b.slot}`} />
                        <button name="op" value="win" className="btn btn-neon btn-sm">Save</button>
                        {b.win != null && <button name="op" value="clear" className="px-1 text-xs text-dim hover:text-text">reset</button>}
                      </>
                    )}
                    {editable && (
                      <>
                        <button name="op" value="up" disabled={i === 0} className="grid size-8 place-items-center rounded-lg text-dim hover:text-text disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                        <button name="op" value="down" disabled={i === hunt.bonuses.length - 1} className="grid size-8 place-items-center rounded-lg text-dim hover:text-text disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                        <button name="op" value="delete" className="grid size-8 place-items-center rounded-lg text-dim hover:text-danger" aria-label={`Delete ${b.slot}`}><X className="size-4" /></button>
                      </>
                    )}
                  </form>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </>
  );
}
