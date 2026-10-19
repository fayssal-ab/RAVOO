import Link from "next/link";
import { AdminTitle, Card } from "@/components/admin/ui";
import { getStats } from "@/lib/userAdmin";
import { listRedemptions } from "@/lib/store";
import { listClaims } from "@/lib/milestones";

export default async function AdminDashboard() {
  const [stats, pending, claims] = await Promise.all([getStats(), listRedemptions({ status: "pending", limit: 8 }), listClaims({ status: "pending", limit: 100 })]);
  const tiles = [
    { label: "Accounts", value: stats.users.toLocaleString("en-US"), href: "/admin/users" },
    { label: "Points in wallets", value: stats.points_out.toLocaleString("en-US"), href: "/admin/users" },
    { label: "Pending redemptions", value: String(stats.pending), href: "/admin/store", hot: stats.pending > 0 },
    { label: "Milestone claims", value: String(claims.length), href: "/admin/milestones", hot: claims.length > 0 },
  ];
  return (
    <>
      <AdminTitle title="Dashboard">
        {stats.live_period ? <>Live period: <span className="text-neon">{stats.live_period}</span> · {stats.board_players} players on the board.</> : "No leaderboard period is live right now."}
      </AdminTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`panel p-5 transition hover:border-line-hot ${t.hot ? "neon-frame is-on" : ""}`}>
            <p className="font-mono text-3xl font-bold text-neon">{t.value}</p>
            <p className="mt-1 font-head text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t.label}</p>
          </Link>
        ))}
      </div>
      <Card title="Waiting for payout" className="mt-6">
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span><span className="font-bold">{r.display_name}</span> <span className="text-muted">({r.qzino_username || "no Qzino name"})</span></span>
                <span>{r.item_name} · <span className="font-mono text-neon">{r.price}</span></span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/store" className="btn btn-ghost btn-sm mt-4">Open the queue</Link>
      </Card>
    </>
  );
}
