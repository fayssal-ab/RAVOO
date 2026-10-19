import { AdminTitle, Card, Field } from "@/components/admin/ui";
import { Flash } from "@/components/ui/bits";
import { getLiveStatus, getSchedule, WEEKDAYS } from "@/lib/stream";
import { addSlotAction, deleteSlotAction } from "../actions";

export default async function AdminStream({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [schedule, live] = await Promise.all([getSchedule(), getLiveStatus()]);
  return (
    <>
      <AdminTitle title="Stream">
        Live status comes from Kick automatically ({live.live ? "live now" : "offline"}, {live.followers.toLocaleString("en-US")} followers). Times are UTC.
      </AdminTitle>
      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Add a slot">
          <form action={addSlotAction} className="space-y-4">
            <Field label="Day">
              <select name="weekday" className="field">{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
            </Field>
            <Field label="Start (UTC)"><input name="start_time" type="time" required className="field" /></Field>
            <Field label="Title"><input name="title" maxLength={120} placeholder="Bonus hunt night" className="field" /></Field>
            <button className="btn btn-neon btn-sm">Add</button>
          </form>
        </Card>
        <Card title="Schedule">
          {schedule.length === 0 ? (
            <p className="text-sm text-muted">Empty: the public page says there&apos;s no fixed schedule.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {schedule.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span><span className="font-bold">{WEEKDAYS[s.weekday]}</span> · <span className="font-mono">{s.start_time}</span>{s.title && ` · ${s.title}`}</span>
                  <form action={deleteSlotAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs text-dim hover:text-danger" aria-label="Delete slot">✕</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
