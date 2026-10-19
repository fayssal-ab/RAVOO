// Brand shapes drawn in SVG so they stay crisp at any size and can be tinted
// with currentColor: the pug's paw, a casino chip, card suits, a sleep mask
// and the slime drip edge from the dripping logo letters.

type P = { className?: string; style?: React.CSSProperties };

/** Pug paw: big pad + four toe beans. */
export function Paw({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M50 50c11 0 25 12 25 25 0 9-7 14-15 14-5 0-7-3-10-3s-5 3-10 3c-8 0-15-5-15-14 0-13 14-25 25-25Z" />
      <ellipse fill="currentColor" cx="24" cy="44" rx="9" ry="12" transform="rotate(-24 24 44)" />
      <ellipse fill="currentColor" cx="40" cy="25" rx="9" ry="13" transform="rotate(-8 40 25)" />
      <ellipse fill="currentColor" cx="60" cy="25" rx="9" ry="13" transform="rotate(8 60 25)" />
      <ellipse fill="currentColor" cx="76" cy="44" rx="9" ry="12" transform="rotate(24 76 44)" />
    </svg>
  );
}

/** Casino chip with edge inserts. */
export function Chip({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="currentColor" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#040605" strokeWidth="10" strokeDasharray="14 22" opacity=".55" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#040605" strokeWidth="3" opacity=".5" />
      <circle cx="50" cy="50" r="22" fill="#040605" opacity=".35" />
    </svg>
  );
}

export function Spade({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M50 6C38 26 14 38 14 58c0 12 9 20 20 20 6 0 10-2 13-6-1 8-5 15-11 20h28c-6-5-10-12-11-20 3 4 7 6 13 6 11 0 20-8 20-20C86 38 62 26 50 6Z" />
    </svg>
  );
}

export function Club({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M50 8a19 19 0 0 0-15 31A19 19 0 1 0 45 72c-1 8-5 15-11 20h32c-6-5-10-12-11-20a19 19 0 1 0 10-33A19 19 0 0 0 50 8Z" />
    </svg>
  );
}

export function Diamond({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M50 4 84 50 50 96 16 50Z" />
    </svg>
  );
}

/** Sleep mask like the one the pug wears. */
export function SleepMask({ className, style }: P) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M8 22C20 6 46 4 60 12 74 4 100 6 112 22c6 9 2 24-12 28-14 4-28-2-40-12-12 10-26 16-40 12C6 46 2 31 8 22Z" />
      <path fill="none" stroke="#040605" strokeWidth="3" opacity=".45" d="M2 20c-2-4 0-8 4-8M118 20c2-4 0-8-4-8" />
      <path fill="none" stroke="#040605" strokeWidth="2.5" strokeLinecap="round" opacity=".5" d="M24 30q10 8 20 0M76 30q10 8 20 0" />
    </svg>
  );
}

// Drip layout across a 1440-wide edge: [center x, bulb radius, length].
const DRIPS: [number, number, number][] = [
  [60, 13, 52], [170, 8, 30], [290, 18, 92], [410, 9, 38], [520, 14, 66], [630, 7, 26], [760, 20, 104],
  [890, 10, 44], [1000, 15, 74], [1110, 8, 32], [1220, 17, 86], [1330, 11, 48], [1410, 7, 28],
];
const BASE = 22;

/**
 * Slime along the top with drops hanging off it: each drop leaves the base
 * with a soft fillet, thins into a neck, then swells into a round bulb.
 */
function dripPath(): string {
  let d = `M0 0H1440V${BASE}`;
  for (const [c, r, l] of [...DRIPS].reverse()) {
    const neck = r * 0.55;
    const cy = BASE + l - r; // bulb centre
    d += `L${c + r + 16} ${BASE}`;
    d += `C${c + neck + 4} ${BASE} ${c + neck} ${BASE + 4} ${c + neck} ${BASE + (cy - BASE) * 0.5}`;
    d += `C${c + neck} ${cy - r * 0.9} ${c + r} ${cy - r * 0.8} ${c + r} ${cy}`;
    d += `A${r} ${r} 0 0 1 ${c - r} ${cy}`;
    d += `C${c - r} ${cy - r * 0.8} ${c - neck} ${cy - r * 0.9} ${c - neck} ${BASE + (cy - BASE) * 0.5}`;
    d += `C${c - neck} ${BASE + 4} ${c - neck - 4} ${BASE} ${c - r - 16} ${BASE}`;
  }
  return `${d}L0 ${BASE}Z`;
}
const DRIP_D = dripPath();

/**
 * Slime drip edge from the dripping logo letters. Default: slime on top,
 * drops hanging down (bottom of a band). `up` mirrors it for the top of the
 * footer (drops rising into the page).
 */
export function DripEdge({ className, up = false }: { className?: string; up?: boolean }) {
  return (
    <svg viewBox="0 0 1440 130" preserveAspectRatio="none" className={className} style={up ? { transform: "scaleY(-1)" } : undefined} aria-hidden>
      <path fill="currentColor" d={DRIP_D} />
    </svg>
  );
}

/** Soft slime wave for the top of the footer (body below, crests above). */
export function GooWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M0 62C90 34 170 30 250 52s150 46 250 30 160-58 260-56 150 44 240 52 170-40 250-48 130 20 190 36V110H0Z"
      />
    </svg>
  );
}
