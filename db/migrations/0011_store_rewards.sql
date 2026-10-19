-- Store rebuilt around a few small, real rewards (no rank requirement). The
-- old rank-gated items (ranks 31-40) are deactivated, not deleted, so past
-- redemptions keep their history. Prices stay on the old point scale
-- ($5 tip = 20 points). Everything stays editable in Admin -> Store.
UPDATE store_items SET active = 0 WHERE active = 1 AND min_rank >= 31;

INSERT INTO store_items (name, description, kind, price, min_rank, sort)
SELECT '$5 Qzino tip', 'A $5 tip sent to your Qzino account (your Qzino username must be set on your account).', 'cash', 20, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM store_items WHERE name = '$5 Qzino tip' AND min_rank = 1);
INSERT INTO store_items (name, description, kind, price, min_rank, sort)
SELECT '$10 Qzino tip', 'A $10 tip sent to your Qzino account (your Qzino username must be set on your account).', 'cash', 50, 1, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM store_items WHERE name = '$10 Qzino tip' AND min_rank = 1);
INSERT INTO store_items (name, description, kind, price, min_rank, sort)
SELECT '$20 Qzino tip', 'A $20 tip sent to your Qzino account (your Qzino username must be set on your account).', 'cash', 100, 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM store_items WHERE name = '$20 Qzino tip' AND min_rank = 1);
INSERT INTO store_items (name, description, kind, price, min_rank, sort)
SELECT '$40 bonus buy split', 'Ravo opens a $40 bonus buy on stream for you and splits the win with you.', 'bonus', 200, 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM store_items WHERE name = '$40 bonus buy split' AND min_rank = 1);
INSERT INTO store_items (name, description, kind, price, min_rank, sort)
SELECT '$100 bonus buy split', 'Ravo opens a $100 bonus buy on stream for you and splits the win with you.', 'bonus', 400, 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM store_items WHERE name = '$100 bonus buy split' AND min_rank = 1);
