// Netlify runs this on published deploys every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).
export const config = { schedule: "0 */6 * * *" };

export default async function syncLeaderboard() {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) throw new Error("URL and CRON_SECRET are required for leaderboard sync");
  const response = await fetch(new URL("/api/cron/leaderboard", base), {
    method: "POST", headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(27000),
  });
  if (!response.ok) throw new Error(`Leaderboard sync failed: HTTP ${response.status}`);
  console.log("Leaderboard sync completed", await response.json());
}
