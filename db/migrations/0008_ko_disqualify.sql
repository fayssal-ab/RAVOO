-- Admin can disqualify a tournament player (kept for the record, out of play).
ALTER TABLE ko_participants ADD COLUMN disqualified TINYINT(1) NOT NULL DEFAULT 0;
