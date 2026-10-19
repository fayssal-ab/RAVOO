-- Wager leaderboard periods (entries are entered by an admin; no casino feed
-- yet) and points raffles with a provably-fair draw.

CREATE TABLE IF NOT EXISTS lb_periods (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120)   NOT NULL,
  starts_at   DATETIME       NOT NULL,
  ends_at     DATETIME       NOT NULL,
  prize_pool  DECIMAL(20,8)  NOT NULL DEFAULT 0,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lb_periods_dates (starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lb_prizes (
  period_id  BIGINT         NOT NULL,
  place      INT            NOT NULL,
  amount     DECIMAL(20,8)  NOT NULL,
  PRIMARY KEY (period_id, place),
  CONSTRAINT fk_lb_prize_period FOREIGN KEY (period_id) REFERENCES lb_periods(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lb_entries (
  period_id   BIGINT         NOT NULL,
  username    VARCHAR(64)    NOT NULL,
  wagered     DECIMAL(20,8)  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (period_id, username),
  INDEX idx_lb_entries_rank (period_id, wagered),
  CONSTRAINT fk_lb_entry_period FOREIGN KEY (period_id) REFERENCES lb_periods(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS raffles (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(120)  NOT NULL,
  prize             VARCHAR(120)  NOT NULL,
  cost              INT UNSIGNED  NOT NULL DEFAULT 0,     -- points per ticket
  max_tickets       INT UNSIGNED  NOT NULL DEFAULT 1,     -- per account
  min_rank          INT           NOT NULL DEFAULT 1,
  winners           INT UNSIGNED  NOT NULL DEFAULT 1,
  ends_at           DATETIME      NOT NULL,
  status            ENUM('open','drawn','cancelled') NOT NULL DEFAULT 'open',
  server_seed       VARCHAR(66)   NOT NULL,
  server_seed_hash  CHAR(64)      NOT NULL,
  entries_hash      CHAR(64)      NULL,
  tickets_snapshot  MEDIUMTEXT    NULL,     -- the hashed ticket lines, frozen at draw
  drawn_at          DATETIME      NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_raffles_status (status, ends_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS raffle_entries (
  raffle_id   BIGINT        NOT NULL,
  account_id  BIGINT        NOT NULL,
  tickets     INT UNSIGNED  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (raffle_id, account_id),
  CONSTRAINT fk_raffle_entry_raffle FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
  CONSTRAINT fk_raffle_entry_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS raffle_winners (
  raffle_id     BIGINT        NOT NULL,
  place         INT           NOT NULL,
  account_id    BIGINT        NULL,
  display_name  VARCHAR(191)  NOT NULL,
  ticket_index  INT           NOT NULL,
  PRIMARY KEY (raffle_id, place),
  CONSTRAINT fk_raffle_winner_raffle FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
  CONSTRAINT fk_raffle_winner_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB;
