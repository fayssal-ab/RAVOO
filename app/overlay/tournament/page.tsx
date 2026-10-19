import { KoOverlay } from "@/components/tournament/KoOverlay";

export const dynamic = "force-dynamic";

/** OBS browser source: tall by default (about 480×860); `?wide` = the 1920×1080 layout. */
export default async function TournamentOverlay({ searchParams }: { searchParams: Promise<{ wide?: string }> }) {
  const { wide } = await searchParams;
  return <KoOverlay wide={wide != null} />;
}
