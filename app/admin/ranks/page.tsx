import { AdminTitle, Card } from "@/components/admin/ui";
import { Flash } from "@/components/ui/bits";
import { RankBadge } from "@/components/ui/RankBadge";
import { getRanks } from "@/lib/account";
import { saveRanksAction } from "../actions";

export default async function AdminRanks({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ranks = await getRanks();
  return (
    <>
      <AdminTitle title="Ranks">Names and the lifetime XP needed for each of the 40 levels. Level 1 starts at 0 and each level needs more than the one before.</AdminTitle>
      <Flash ok={sp.ok} error={sp.error} detail={sp.detail} />
      <Card>
        <form action={saveRanksAction}>
          <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
            {ranks.map((r) => (
              <div key={r.level} className="grid grid-cols-[auto_1fr_8rem] items-center gap-3">
                <RankBadge level={r.level} compact />
                <input name={`name_${r.level}`} defaultValue={r.name} maxLength={64} required className="field !py-1.5 text-sm" aria-label={`Level ${r.level} name`} />
                <input name={`xp_${r.level}`} type="number" min={0} defaultValue={r.min_xp} required className="field !py-1.5 font-mono text-sm" aria-label={`Level ${r.level} XP`} />
              </div>
            ))}
          </div>
          <button className="btn btn-neon btn-sm mt-6">Save ranks</button>
        </form>
      </Card>
    </>
  );
}
