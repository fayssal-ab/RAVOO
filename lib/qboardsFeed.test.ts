import assert from "node:assert/strict";
import test from "node:test";
import { fetchQboardsSnapshot } from "./qboardsFeed";

const event = { data: {
  title: "Never Sleeps", usePoints: true,
  currentEvent: { _id: "6ace338761d24a7bcd8cab96", startAt: "2026-10-13T13:35:00.000Z", endAt: "2026-11-01T13:35:00.000Z", prizePool: 210 },
} };
const player = (place: number) => ({ userId: `user-${place}`, username: `player${place}`, place, reward: place === 1 ? 77 : 0, points: 1000 / place });

function mock(pages: unknown[], source = event) {
  const urls: URL[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input));
    urls.push(url);
    return Response.json(url.pathname.endsWith("event-data") ? source : pages[Number(url.searchParams.get("page")) - 1]);
  };
  return { fetcher, urls };
}

test("fetches every page pinned to the event and keeps points distinct from dollars", async () => {
  const { fetcher, urls } = mock([
    { data: { total: 11, list: Array.from({ length: 10 }, (_, i) => player(i + 1)) } },
    { data: { total: 11, list: [player(11)] } },
  ]);
  const snapshot = await fetchQboardsSnapshot(fetcher);
  assert.equal(snapshot.rows.length, 11);
  assert.equal(snapshot.usePoints, true);
  assert.equal(snapshot.rows[0].score, "1000");
  assert.equal(snapshot.rows[0].prize, "77");
  assert.equal(snapshot.rows[10].prize, null);
  assert.ok(urls.slice(1).every((u) => u.searchParams.get("id") === event.data.currentEvent._id));
});

test("refuses incomplete pages and duplicated players", async () => {
  for (const list of [[player(1)], [player(1), player(1)]]) {
    await assert.rejects(fetchQboardsSnapshot(mock([{ data: { total: 2, list } }]).fetcher), /incomplete ranking/);
  }
});

test("accepts points only and never falls back to wager dollars", async () => {
  const source = { data: { ...event.data, usePoints: false } };
  await assert.rejects(fetchQboardsSnapshot(mock([{ data: { total: 1, list: [player(1)] } }], source).fetcher));
  const { points: ignored, ...withoutPoints } = player(1);
  void ignored;
  await assert.rejects(fetchQboardsSnapshot(mock([{ data: { total: 1, list: [{ ...withoutPoints, wagerUsd: 50 }] } }]).fetcher));
  const snapshot = await fetchQboardsSnapshot(mock([{ data: { total: 1, list: [{ ...player(1), points: 50, wagerUsd: 9999 }] } }]).fetcher);
  assert.equal(snapshot.rows[0].score, "50");
});

test("fails on upstream errors or invalid responses instead of publishing empty data", async () => {
  await assert.rejects(fetchQboardsSnapshot(async () => new Response("unavailable", { status: 503 })), /HTTP 503/);
  await assert.rejects(fetchQboardsSnapshot(async () => Response.json({ data: {} })));
});
