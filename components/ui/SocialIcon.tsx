// Brand glyphs (lucide has no Kick/Discord).
export function SocialIcon({ name, className }: { name: "kick" | "x" | "discord"; className?: string }) {
  if (name === "kick") {
    return <svg viewBox="0 0 24 24" className={className} aria-hidden><path fill="currentColor" d="M3 2h6v5h2V5h2V3h2V2h6v7h-2v2h-2v2h2v2h2v7h-6v-1h-2v-2h-2v-2H9v5H3z" /></svg>;
  }
  if (name === "x") {
    return <svg viewBox="0 0 24 24" className={className} aria-hidden><path fill="currentColor" d="M17.8 2.5h3.3l-7.2 8.2 8.5 10.8h-6.6l-5.2-6.6-5.9 6.6H1.4l7.7-8.8L1 2.5h6.8l4.7 6.1 5.3-6.1Zm-1.2 17.1h1.8L6.5 4.3H4.5l12.1 15.3Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className={className} aria-hidden><path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.2a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7ZM8.1 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" /></svg>;
}
