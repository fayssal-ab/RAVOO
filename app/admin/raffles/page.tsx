import { AdminTitle, Card, Field } from "@/components/admin/ui";
import { Flash } from "@/components/ui/bits";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { listRaffles } from "@/lib/raffles";
import { createRaffleAction, raffleOpAction } from "../actions";

export default async function AdminRaffles({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const raffles = await listRaffles(null);
  return (
    <>
      <AdminTitle title="Raffles">The seed is generated and its hash published when you create a raffle. Draw after it ends; cancelling refunds every ticket.</AdminTitle>
      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="New raffle">
          <form action={createRaffleAction} className="space-y-4">
            <Field label="Title"><input name="title" required maxLength={120} placeholder="Weekly points raffle" className="field" /></Field>
            <Field label="Prize"><input name="prize" required maxLength={120} placeholder="$100 Qzino tip" className="field" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Points per ticket"><input name="cost" type="number" min={0} defaultValue={50} required className="field font-mono" /></Field>
              <Field label="Max tickets / user"><input name="max_tickets" type="number" min={1} max={1000} defaultValue={10} required className="field font-mono" /></Field>
              <Field label="Min rank"><input name="min_rank" type="number" min={1} max={40} defaultValue={1} required className="field font-mono" /></Field>
              <Field label="Winners"><input name="winners" type="number" min={1} max={100} defaultValue={1} required className="field font-mono" /></Field>
            </div>
            <Field label="Ends (UTC)"><input name="ends_at" type="datetime-local" required className="field" /></Field>
            <button className="btn btn-neon btn-sm">Create raffle</button>
          </form>
        </Card>
        <Card title="All raffles">
          {raffles.length === 0 ? (
            <p className="text-sm text-muted">None yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {raffles.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p><span className="font-bold">{r.title}</span> · {r.prize}</p>
                      <p className="text-xs text-muted">
                        <span className={r.status === "open" ? "text-neon" : r.status === "drawn" ? "text-gold" : "text-danger"}>{r.status}</span>
                        {" · "}ends {r.ends_at} · {r.total_tickets} tickets / {r.entrants} players · {r.cost} pts
                      </p>
                      {r.results.length > 0 && <p className="text-xs text-gold">Winners: {r.results.map((w) => w.display_name).join(", ")}</p>}
                    </div>
                    <div className="flex gap-2">
                      {r.status === "open" && (
                        <>
                          <form action={raffleOpAction}>
                            <input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="draw" />
                            <ConfirmButton className="btn btn-neon btn-sm" title="Draw now?" confirmLabel="Draw" body="Locks the tickets and reveals the seed. Only works after the end time.">Draw</ConfirmButton>
                          </form>
                          <form action={raffleOpAction}>
                            <input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="cancel" />
                            <ConfirmButton className="btn btn-ghost btn-sm !text-danger" danger title="Cancel raffle?" confirmLabel="Cancel & refund" body="Every ticket is refunded in points.">Cancel</ConfirmButton>
                          </form>
                        </>
                      )}
                      {r.status !== "open" && (
                        <form action={raffleOpAction}>
                          <input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="delete" />
                          <ConfirmButton className="btn btn-ghost btn-sm !text-danger" danger title="Delete raffle?" confirmLabel="Delete" body="Removes it and its draw record from the site.">Delete</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
