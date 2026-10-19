// Endless pixel-font marquee strip between sections.
export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative -rotate-1 border-y border-neon/40 bg-neon py-3 text-neon-ink shadow-[0_0_40px_rgb(141_255_74/0.35)]">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-pixel text-lg uppercase tracking-[0.15em]">
          {row.map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t}
              <svg viewBox="0 0 10 10" className="size-3" aria-hidden><path d="M5 0 6 4 10 5 6 6 5 10 4 6 0 5 4 4z" fill="currentColor" /></svg>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
