// E2E for monthly milestones against a throwaway database:
//   DB_NAME=ravo_test node --env-file-if-exists=.env.local --conditions=react-server --import tsx --test tests/e2e/milestones-monthly.test.ts
import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { ResultSetHeader } from "mysql2/promise";
import { claimMilestone, claimsFor, monthKey, monthlyWager } from "../../lib/milestones";
import { getPool } from "../../lib/db";

if (process.env.DB_NAME !== "ravo_test") throw new Error("refusing to run outside ravo_test");
after(() => getPool().end());

test("wager counts this month only; one claim per milestone per month", async () => {
  const pool = getPool();
  const tag = `m${Date.now()}`;
  const [acc] = await pool.query<ResultSetHeader>("INSERT INTO user_accounts (display_name, qzino_username) VALUES (?, ?)", [tag, tag]);
  const accountId = acc.insertId;
  const [ms] = await pool.query<ResultSetHeader>("INSERT INTO milestones (name, min_wager, reward) VALUES (?, ?, 10)", [tag, 1000 + (Date.now() % 100000)]);
  const milestoneId = ms.insertId;
  const now = new Date();
  const thisMonth = `${monthKey(now)}-02 00:00:00`;
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 2)).toISOString().slice(0, 19).replace("T", " ");
  const [p1] = await pool.query<ResultSetHeader>("INSERT INTO lb_periods (title, starts_at, ends_at) VALUES ('t', ?, ?)", [thisMonth, thisMonth]);
  const [p0] = await pool.query<ResultSetHeader>("INSERT INTO lb_periods (title, starts_at, ends_at) VALUES ('t', ?, ?)", [lastMonth, lastMonth]);
  await pool.query("INSERT INTO lb_entries (period_id, username, wagered) VALUES (?, ?, 999999), (?, ?, 500)", [p0.insertId, tag, p1.insertId, tag]);

  assert.equal(Number(await monthlyWager(tag)), 500); // last month's 999,999 doesn't count
  await assert.rejects(claimMilestone(accountId, milestoneId), /not_reached/);
  await pool.query("UPDATE lb_entries SET wagered = 200000 WHERE period_id = ? AND username = ?", [p1.insertId, tag]);
  await claimMilestone(accountId, milestoneId);
  await assert.rejects(claimMilestone(accountId, milestoneId), /already_claimed/);
  assert.equal((await claimsFor(accountId)).get(milestoneId), "pending");
  // a claim from last month doesn't block this month
  await pool.query("UPDATE milestone_claims SET claim_month = ? WHERE account_id = ?", [lastMonth.slice(0, 7), accountId]);
  assert.equal((await claimsFor(accountId)).size, 0);
  await claimMilestone(accountId, milestoneId);
  assert.equal((await claimsFor(accountId)).get(milestoneId), "pending");
});
