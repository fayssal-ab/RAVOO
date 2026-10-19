-- Milestones are monthly: the wager counts per calendar month (UTC, by the
-- leaderboard period's start) and each milestone can be claimed once a month.
ALTER TABLE milestone_claims ADD COLUMN claim_month CHAR(7) NOT NULL DEFAULT '';
UPDATE milestone_claims SET claim_month = DATE_FORMAT(created_at, '%Y-%m') WHERE claim_month = '';
-- new key first: the account FK needs an index starting with account_id
ALTER TABLE milestone_claims ADD UNIQUE KEY uq_claim_month (account_id, milestone_id, claim_month);
ALTER TABLE milestone_claims DROP INDEX uq_claim;
