-- Duo (2v2) tournaments: players register alone, then get paired at random.
-- team_size 1 = solo, 2 = duo. Both members carry the captain's id in
-- team_id; the bracket runs on captains. Matches keep the second bonus of
-- each team in the *b columns; the higher combined multiplier wins.
ALTER TABLE ko_tournaments ADD COLUMN team_size TINYINT NOT NULL DEFAULT 1;
ALTER TABLE ko_participants ADD COLUMN team_id BIGINT NULL;
ALTER TABLE ko_matches
  ADD COLUMN p1b_cost DECIMAL(20,2) NULL,
  ADD COLUMN p1b_payout DECIMAL(20,2) NULL,
  ADD COLUMN p2b_cost DECIMAL(20,2) NULL,
  ADD COLUMN p2b_payout DECIMAL(20,2) NULL;
