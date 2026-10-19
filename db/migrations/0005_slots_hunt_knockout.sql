-- Slot catalogue (names, providers, art), ONO-style bonus hunt (slot art,
-- list locked once opening starts) and the 16-player Kick-chat knockout.

-- Row locks that serialise "only one active X" checks.
CREATE TABLE IF NOT EXISTS app_locks (
  name  VARCHAR(32) PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO app_locks (name) VALUES ('ko'), ('hunt'), ('slots');

-- One row per catalogue slot. popularity: 0 = most played.
CREATE TABLE IF NOT EXISTS slot_catalog (
  id          VARCHAR(191)  PRIMARY KEY,
  slug        VARCHAR(191)  NOT NULL,
  name        VARCHAR(191)  NOT NULL,
  name_norm   VARCHAR(191)  NOT NULL,
  provider    VARCHAR(120)  NOT NULL DEFAULT '',
  image_url   VARCHAR(512)  NULL,
  popularity  INT           NULL,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  synced_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slot_pool (active, popularity),
  INDEX idx_slot_norm (name_norm)
) ENGINE=InnoDB;

-- Hunt: one hunt is 'collecting' or 'opening' at a time. The first win moves
-- it to 'opening' and locks the bonus list.
ALTER TABLE bonus_hunts
  ADD COLUMN opening_started_at DATETIME NULL AFTER status,
  ADD COLUMN finished_at        DATETIME NULL AFTER opening_started_at;

ALTER TABLE hunt_bonuses
  ADD COLUMN slot_id   VARCHAR(191) NULL AFTER hunt_id,
  ADD COLUMN image_url VARCHAR(512) NULL AFTER provider;

-- ── knockout ──
-- status: open = registration open; closed = registration closed, bracket in
-- progress; finished = champion crowned; cancelled = reset by the admin.
CREATE TABLE IF NOT EXISTS ko_tournaments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(120)   NOT NULL DEFAULT '',
  prize           VARCHAR(120)   NOT NULL DEFAULT '',
  prize_1         DECIMAL(20,2)  NULL,
  prize_2         DECIMAL(20,2)  NULL,
  prize_3         DECIMAL(20,2)  NULL,
  status          ENUM('open','closed','finished','cancelled') NOT NULL DEFAULT 'closed',
  max_players     TINYINT        NOT NULL DEFAULT 16,
  champion_id     BIGINT         NULL,
  runner_up_id    BIGINT         NULL,
  third_id        BIGINT         NULL,
  roll_seq        INT            NOT NULL DEFAULT 0,
  focus_match_id  BIGINT         NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at       TIMESTAMP      NULL,
  closed_at       TIMESTAMP      NULL,
  finished_at     TIMESTAMP      NULL,
  INDEX idx_ko_status (status)
) ENGINE=InnoDB;

-- One row per Kick account per tournament. Slot fields are a snapshot.
CREATE TABLE IF NOT EXISTS ko_participants (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  tournament_id  INT           NOT NULL,
  kick_user_id   VARCHAR(64)   NOT NULL,
  username       VARCHAR(191)  NOT NULL,
  slot_id        VARCHAR(191)  NOT NULL,
  slot_name      VARCHAR(191)  NOT NULL,
  slot_provider  VARCHAR(120)  NOT NULL,
  slot_image     VARCHAR(512)  NOT NULL,
  state          ENUM('registered','in_knockout','eliminated','champion') NOT NULL DEFAULT 'registered',
  bracket_pos    TINYINT       NULL,
  rerolls        INT           NOT NULL DEFAULT 0,
  joined_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ko_player (tournament_id, kick_user_id),
  UNIQUE KEY uq_ko_pos (tournament_id, bracket_pos),
  INDEX idx_ko_state (tournament_id, state),
  CONSTRAINT fk_ko_part_t FOREIGN KEY (tournament_id) REFERENCES ko_tournaments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16 matches: round 1 = round of 16 (8), 2 = quarter-finals (4),
-- 3 = semi-finals (2), 4 = finals (match 0 = Grand Final, 1 = 3rd place).
CREATE TABLE IF NOT EXISTS ko_matches (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  tournament_id  INT       NOT NULL,
  round          TINYINT   NOT NULL,
  match_index    TINYINT   NOT NULL,
  p1_id          BIGINT    NULL,
  p2_id          BIGINT    NULL,
  p1_cost        DECIMAL(20,2) NULL,
  p1_payout      DECIMAL(20,2) NULL,
  p2_cost        DECIMAL(20,2) NULL,
  p2_payout      DECIMAL(20,2) NULL,
  status         ENUM('empty','rolled','ready','live','done','bye','void') NOT NULL DEFAULT 'empty',
  winner_id      BIGINT    NULL,
  roll_seq       INT       NULL,
  rolled_at      TIMESTAMP NULL,
  started_at     TIMESTAMP NULL,
  finished_at    TIMESTAMP NULL,
  UNIQUE KEY uq_ko_match (tournament_id, round, match_index),
  INDEX idx_ko_match_status (tournament_id, status),
  CONSTRAINT fk_ko_match_t FOREIGN KEY (tournament_id) REFERENCES ko_tournaments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Chat message ids already processed for !join (a replayed message must not reroll).
CREATE TABLE IF NOT EXISTS ko_join_seen (
  message_id  VARCHAR(191) PRIMARY KEY,
  seen_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ko_seen_time (seen_at)
) ENGINE=InnoDB;
