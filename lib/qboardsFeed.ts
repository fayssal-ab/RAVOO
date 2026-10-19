import { z } from "zod";
import Decimal from "decimal.js";

// Public read endpoints used by q-boards.com's own frontend. No casino key.
export const QBOARDS_NAME = "ravoneversleeps";
export const QBOARDS_URL = `https://q-boards.com/${QBOARDS_NAME}`;
const amount = z.union([z.number().finite(), z.string().regex(/^\d+(\.\d+)?$/)])
  .transform((v) => new Decimal(v).toDecimalPlaces(8).toFixed())
  .refine((v) => new Decimal(v).gte(0) && new Decimal(v).lt("1000000000000"));
const date = z.string().datetime();
const eventItem = z.object({
  _id: z.string().regex(/^[a-f0-9]{24}$/), startAt: date, endAt: date,
  prizePool: amount,
});
const eventSchema = z.object({ data: z.object({
  title: z.string().min(1).max(120),
  usePoints: z.literal(true),
  currentEvent: eventItem,
  // every event (month) of the board; older ones may miss fields → skipped
  allEvents: z.array(z.unknown()).optional(),
}) });

export interface QboardsEvent { id: string; startsAt: string; endsAt: string }

/** The board's events: the current one and every other one Q-boards still lists. */
export async function fetchQboardsEvents(fetcher: typeof fetch = fetch): Promise<{ current: QboardsEvent; all: QboardsEvent[] }> {
  const response = await fetcher(`https://q-boards.com/api/qboard/event-data?${new URLSearchParams({ name: QBOARDS_NAME })}`, {
    cache: "no-store", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Q-boards HTTP ${response.status}`);
  const { data } = eventSchema.parse(await response.json());
  const toEvent = (e: z.infer<typeof eventItem>): QboardsEvent => ({ id: e._id, startsAt: e.startAt, endsAt: e.endAt });
  const all = (data.allEvents ?? []).flatMap((e) => { const r = eventItem.safeParse(e); return r.success ? [toEvent(r.data)] : []; });
  const current = toEvent(data.currentEvent);
  if (!all.some((e) => e.id === current.id)) all.push(current);
  return { current, all };
}
const tableSchema = z.object({ data: z.object({
  total: z.number().int().min(0).max(10000),
  pageSize: z.number().int().positive().max(1000).optional(),
  list: z.array(z.object({
    userId: z.string().min(1), username: z.string().min(1).max(64),
    place: z.number().int().positive(), reward: amount,
    points: amount,
  })),
}) });

export interface QboardsSnapshot {
  eventId: string; title: string; startsAt: string; endsAt: string;
  prizePool: string; usePoints: true;
  rows: { rank: number; username: string; score: string; prize: string | null }[];
}

/** Full ranking of one event (default: the current one). */
export async function fetchQboardsSnapshot(fetcher: typeof fetch = fetch, eventId?: string): Promise<QboardsSnapshot> {
  // Bound the entire run, including all pages, to fit the scheduled job.
  const signal = AbortSignal.timeout(20000);
  async function read(path: string, params: Record<string, string>) {
    const response = await fetcher(`https://q-boards.com/api/qboard/${path}?${new URLSearchParams(params)}`, {
      cache: "no-store", signal, headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Q-boards HTTP ${response.status}`);
    return response.json();
  }
  const { data: event } = eventSchema.parse(await read("event-data", { name: QBOARDS_NAME }));
  const listed = eventId && eventId !== event.currentEvent._id
    ? (event.allEvents ?? []).map((e) => eventItem.safeParse(e)).find((r) => r.success && r.data._id === eventId)
    : null;
  if (eventId && eventId !== event.currentEvent._id && !listed?.success) throw new Error("Q-boards event not listed");
  const current = listed?.success ? listed.data : event.currentEvent;
  if (current.endAt <= current.startAt) throw new Error("Q-boards invalid event dates");
  const params = { name: QBOARDS_NAME, id: current._id };
  const { data: first } = tableSchema.parse(await read("table-data", { ...params, page: "1" }));
  const size = first.pageSize ?? 10;
  const rows = [...first.list];
  for (let page = 2; page <= Math.ceil(first.total / size); page++) {
    const { data } = tableSchema.parse(await read("table-data", { ...params, page: String(page) }));
    if (data.total !== first.total || (data.pageSize ?? size) !== size) throw new Error("Q-boards changed during sync; retry later");
    rows.push(...data.list);
  }
  if (rows.length !== first.total || new Set(rows.map((r) => r.userId)).size !== rows.length ||
    new Set(rows.map((r) => r.place)).size !== rows.length) throw new Error("Q-boards incomplete ranking");
  rows.sort((a, b) => a.place - b.place);
  return {
    eventId: current._id, title: event.title, startsAt: current.startAt, endsAt: current.endAt,
    prizePool: current.prizePool, usePoints: event.usePoints,
    rows: rows.map((r, i) => {
      if (r.place !== i + 1) throw new Error("Q-boards invalid rank");
      return { rank: r.place, username: r.username, score: r.points, prize: new Decimal(r.reward).gt(0) ? r.reward : null };
    }),
  };
}
