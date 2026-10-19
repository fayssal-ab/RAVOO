-- Wager milestones (lifetime Qzino wager → one-time cash reward), bonus hunt
-- tracker and the weekly stream schedule.

CREATE TABLE IF NOT EXISTS milestones (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64)    NOT NULL,
  min_wager  DECIMAL(20,8)  NOT NULL,
  reward     DECIMAL(20,8)  NOT NULL,
  UNIQUE KEY uq_milestone_wager (min_wager)
) ENGINE=InnoDB;

-- One claim per account per milestone. Wager and reward are snapshotted.
CREATE TABLE IF NOT EXISTS milestone_claims (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id      BIGINT         NOT NULL,
  milestone_id    BIGINT         NOT NULL,
  milestone_name  VARCHAR(64)    NOT NULL,
  qzino_username  VARCHAR(64)    NOT NULL,
  wagered         DECIMAL(20,8)  NOT NULL,
  reward          DECIMAL(20,8)  NOT NULL,
  status          ENUM('pending','paid','rejected') NOT NULL DEFAULT 'pending',
  admin_note      VARCHAR(255)   NOT NULL DEFAULT '',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_claim (account_id, milestone_id),
  INDEX idx_claims_status (status, created_at),
  CONSTRAINT fk_claim_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bonus_hunts (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(120)   NOT NULL,
  start_balance  DECIMAL(20,8)  NOT NULL,
  status         ENUM('collecting','opening','finished') NOT NULL DEFAULT 'collecting',
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hunts_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hunt_bonuses (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  hunt_id    BIGINT         NOT NULL,
  slot       VARCHAR(120)   NOT NULL,
  provider   VARCHAR(64)    NOT NULL DEFAULT '',
  called_by  VARCHAR(64)    NOT NULL DEFAULT '',
  bet        DECIMAL(20,8)  NOT NULL,
  win        DECIMAL(20,8)  NULL,           -- NULL = not opened yet
  sort       INT            NOT NULL DEFAULT 0,
  INDEX idx_bonuses_hunt (hunt_id, sort, id),
  CONSTRAINT fk_bonus_hunt FOREIGN KEY (hunt_id) REFERENCES bonus_hunts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- weekday: 0 = Monday … 6 = Sunday; start_time is UTC.
CREATE TABLE IF NOT EXISTS stream_schedule (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  weekday     TINYINT       NOT NULL,
  start_time  TIME          NOT NULL,
  title       VARCHAR(120)  NOT NULL DEFAULT '',
  INDEX idx_schedule (weekday, start_time)
) ENGINE=InnoDB;
