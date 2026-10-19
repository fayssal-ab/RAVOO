// Public brand config. NEXT_PUBLIC_* values are safe to ship to the browser.

export const SITE_NAME = "RAVONEVERSLEEPS";
export const SITE_SHORT = "RAVO";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_TAGLINE = "Play on Qzino with code RAVO50. Climb the monthly leaderboard, hit wager milestones, spend your points.";

export const QZINO_CODE = process.env.NEXT_PUBLIC_QZINO_CODE || "RAVO50";
export const QZINO_URL = process.env.NEXT_PUBLIC_QZINO_URL || "https://qzino-partners.com/trdj40jfb";
/**
 * What the code gets you. Only claims that are confirmed: Ravo's Kick panel
 * also lists "up to 40% cashback, 15% rakeback, instant payouts, non-strict
 * KYC"; those stay off the site until they're re-checked with Qzino.
 */
export const QZINO_PERKS = [
  { value: "$50", label: "Bonus with the code" },
  { value: "Monthly", label: "Leaderboard prizes" },
  { value: "Cashback", label: "& rakeback on Qzino" },
] as const;

export const KICK_CHANNEL = process.env.NEXT_PUBLIC_KICK_CHANNEL || "ravoneversleeps";
export const KICK_URL = `https://kick.com/${KICK_CHANNEL}`;
export const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/GKjE3sUFz3";
export const X_URL = process.env.NEXT_PUBLIC_X_URL || "https://x.com/ravoneversleeps";

export interface NavItem { href: string; label: string; children?: { href: string; label: string; hint: string }[] }

export const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/milestones", label: "Milestones" },
  { href: "/challenges", label: "Challenges" },
  {
    href: "/stream",
    label: "Stream",
    children: [
      { href: "/stream", label: "Watch live", hint: "Kick stream & schedule" },
      { href: "/bonus-hunts", label: "Bonus hunts", hint: "Live hunt tracker" },
      { href: "/tournaments", label: "Tournaments", hint: "1v1 slot battles from chat" },
      { href: "/raffles", label: "Raffles", hint: "Spend points on tickets" },
    ],
  },
  { href: "/store", label: "Store" },
];

/** Flat list (footer, mobile menu). */
export const NAV_FLAT = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/milestones", label: "Milestones" },
  { href: "/challenges", label: "Challenges" },
  { href: "/stream", label: "Stream" },
  { href: "/bonus-hunts", label: "Bonus hunts" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/raffles", label: "Raffles" },
  { href: "/store", label: "Store" },
  { href: "/ranks", label: "Ranks" },
];
