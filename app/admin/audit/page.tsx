import { AdminTitle, Card } from "@/components/admin/ui";
import { getAuditLog } from "@/lib/auditLog";

export default async function AdminAudit() {
  const log = await getAuditLog(200);
  return (
    <>
      <AdminTitle title="Audit log">Every admin change, newest first.</AdminTitle>
      <Card>
        {log.length === 0 ? (
          <p className="text-sm text-muted">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-line font-mono text-xs">
            {log.map((e) => (
              <li key={e.id} className="grid gap-1 py-2 sm:grid-cols-[11rem_12rem_1fr]">
                <span className="text-dim">{e.created_at}</span>
                <span className="text-neon">{e.action}</span>
                <span className="break-all text-muted">{e.target} {e.detail != null && JSON.stringify(e.detail).slice(0, 300)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
