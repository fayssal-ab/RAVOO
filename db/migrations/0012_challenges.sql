-- migrate: tolerate-existing
-- Slot challenges: "first to hit N x on <slot> wins $X" (min bet), managed in
-- Admin -> Challenges. The table is also created on first use (lib/challenges.ts).
CREATE TABLE IF NOT EXISTS challenges (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  slot_id       VARCHAR(191)   NULL,
  slot_name     VARCHAR(191)   NOT NULL,
  provider      VARCHAR(120)   NOT NULL DEFAULT '',
  image_url     VARCHAR(512)   NULL,
  target_multi  DECIMAL(12,2)  NOT NULL,
  reward        DECIMAL(20,2)  NOT NULL,
  min_bet       DECIMAL(20,2)  NOT NULL DEFAULT 0,
  status        ENUM('open','won','closed') NOT NULL DEFAULT 'open',
  winner        VARCHAR(191)   NULL,
  winner_multi  DECIMAL(12,2)  NULL,
  won_at        DATETIME       NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_challenges_status (status, created_at)
) ENGINE=InnoDB;
