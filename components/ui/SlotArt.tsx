// Slot box art. Remote art is allowed by the CSP; a slot without art gets a
// neon name tile (initials), never a broken image.
export function SlotArt({ name, src, size = 56, fluid, className = "", rounded = "rounded-xl" }: {
  name: string; src?: string | null; size?: number; className?: string; rounded?: string;
  /** CSS length overriding `size` (e.g. clamp(...)) so the art scales with the screen */
  fluid?: string;
}) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const box = fluid ?? size;
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-line bg-[linear-gradient(135deg,var(--color-surface-3),var(--color-bg-2))] ${rounded} ${className}`}
      style={{ width: box, height: box }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
      ) : (
        <span className="font-display text-neon" style={{ fontSize: fluid ? `calc(${fluid} * 0.32)` : Math.max(10, size * 0.32) }}>{initials || "?"}</span>
      )}
    </span>
  );
}
