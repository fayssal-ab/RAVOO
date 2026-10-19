import type { ReactNode } from "react";

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-4xl"><span className="chrome">{title}</span></h1>
      {children && <p className="mt-2 max-w-2xl text-sm text-muted">{children}</p>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {title && <h2 className="mb-4 font-head text-sm font-bold uppercase tracking-[0.18em] text-neon">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-dim">{hint}</span>}
    </label>
  );
}

/** "YYYY-MM-DD HH:MM:SS" (UTC) → value for <input type="datetime-local">. */
export const toLocalInput = (s: string) => s.replace(" ", "T").slice(0, 16);
