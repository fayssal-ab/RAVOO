import { ArrowUpRight, Gift } from "lucide-react";
import { CopyCode } from "@/components/ui/CopyCode";
import { QzinoLogo } from "@/components/ui/QzinoLogo";
import { QZINO_CODE, QZINO_URL } from "@/lib/constants";

// How to claim the code on Qzino: open Qzino through Ravo's link, open the
// Bonus Hub in Qzino's menu, enter RAVO50. Used in the navbar gift popover
// and on the home page.
export function PromoSteps({ compact = false }: { compact?: boolean }) {
  const steps = [
    {
      title: "Open Qzino with Ravo's link",
      body: "Sign up (or log in) through this link so you count as Ravo's player.",
      extra: (
        <a href={QZINO_URL} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-neon btn-sm mt-3">
          Open <QzinoLogo className="h-4 w-auto brightness-0" /> <ArrowUpRight className="size-4" />
        </a>
      ),
    },
    {
      title: "Go to the Bonus Hub",
      body: "In Qzino's side menu, open the Bonus Hub.",
      extra: (
        <span className="mt-3 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-[#1b1d22] px-3 py-2 text-sm font-semibold text-white" aria-hidden>
          <Gift className="size-4 text-white/70" /> Bonus Hub
          <span className="grid size-5 place-items-center rounded-md bg-[#2f4a12] font-mono text-[11px] text-neon">4</span>
        </span>
      ),
    },
    {
      title: `Enter code ${QZINO_CODE}`,
      body: "Paste the promo code there to unlock your $50 bonus.",
      extra: <div className="mt-3"><CopyCode code={QZINO_CODE} /></div>,
    },
  ];
  return (
    <ol className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-3"}>
      {steps.map((s, i) => (
        <li key={s.title} className={`relative rounded-2xl border border-line bg-bg-2 ${compact ? "p-3 pl-12" : "p-5 pt-7"}`}>
          <span className={`absolute grid size-8 place-items-center rounded-full bg-neon font-mono font-bold text-neon-ink shadow-[0_3px_0_var(--color-neon-deep)] ${compact ? "left-2.5 top-3" : "-top-4 left-5"}`}>{i + 1}</span>
          <p className="font-head font-bold">{s.title}</p>
          <p className="mt-1 text-sm text-muted">{s.body}</p>
          {s.extra}
        </li>
      ))}
    </ol>
  );
}
