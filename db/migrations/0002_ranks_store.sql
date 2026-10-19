-- Rank ladder (levels 1..40, by lifetime xp) and the points store. Each store
-- item needs a minimum rank level to be redeemed.

CREATE TABLE IF NOT EXISTS ranks (
  level   INT          PRIMARY KEY,
  name    VARCHAR(64)  NOT NULL,
  min_xp  BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_rank_min_xp (min_xp)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_items (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120)  NOT NULL,
  description  VARCHAR(500)  NOT NULL DEFAULT '',
  kind         ENUM('cash','bonus','merch','other') NOT NULL DEFAULT 'cash',
  price        INT UNSIGNED  NOT NULL,
  min_rank     INT           NOT NULL DEFAULT 1,
  stock        INT           NULL,          -- NULL = unlimited
  active       TINYINT(1)    NOT NULL DEFAULT 1,
  sort         INT           NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_active (active, sort)
) ENGINE=InnoDB;

-- name/price are snapshotted so editing an item never rewrites history.
CREATE TABLE IF NOT EXISTS store_redemptions (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id  BIGINT        NOT NULL,
  item_id     BIGINT        NULL,
  item_name   VARCHAR(120)  NOT NULL,
  price       INT UNSIGNED  NOT NULL,
  status      ENUM('pending','fulfilled','rejected') NOT NULL DEFAULT 'pending',
  admin_note  VARCHAR(255)  NOT NULL DEFAULT '',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_redemptions_status (status, created_at),
  INDEX idx_redemptions_account (account_id, created_at),
  CONSTRAINT fk_redemption_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_redemption_item FOREIGN KEY (item_id) REFERENCES store_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;
