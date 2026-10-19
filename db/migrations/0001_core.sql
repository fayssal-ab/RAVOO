-- Core: audit log, rate limits, viewer accounts (Kick / Discord sign-in),
-- points balance + ledger.

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor       VARCHAR(64)  NOT NULL,
  action      VARCHAR(64)  NOT NULL,
  target      VARCHAR(191) NOT NULL DEFAULT '',
  detail      JSON         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket    VARCHAR(191) PRIMARY KEY,
  tokens    INT          NOT NULL,
  reset_at  TIMESTAMP    NOT NULL
) ENGINE=InnoDB;

-- points = spendable balance; xp = lifetime points earned (drives the rank,
-- never goes down when points are spent).
CREATE TABLE IF NOT EXISTS user_accounts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  display_name    VARCHAR(191)     NOT NULL,
  avatar          VARCHAR(512)     NOT NULL DEFAULT '',
  qzino_username  VARCHAR(64)      NOT NULL DEFAULT '',
  points          BIGINT UNSIGNED  NOT NULL DEFAULT 0,
  xp              BIGINT UNSIGNED  NOT NULL DEFAULT 0,
  banned          TINYINT(1)       NOT NULL DEFAULT 0,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at   TIMESTAMP        NULL,
  INDEX idx_accounts_qzino (qzino_username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_identities (
  provider          ENUM('kick','discord') NOT NULL,
  provider_user_id  VARCHAR(64)  NOT NULL,
  account_id        BIGINT       NOT NULL,
  username          VARCHAR(191) NOT NULL,
  avatar            VARCHAR(512) NOT NULL DEFAULT '',
  linked_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE KEY uq_identity_account (account_id, provider),
  CONSTRAINT fk_identity_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- The cookie holds a random token; only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash  CHAR(64)  PRIMARY KEY,
  account_id  BIGINT    NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  INDEX idx_user_sessions_account (account_id),
  INDEX idx_user_sessions_expiry (expires_at),
  CONSTRAINT fk_user_session_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Every balance change. delta > 0 also raises xp when kind = 'grant'.
CREATE TABLE IF NOT EXISTS points_ledger (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id  BIGINT       NOT NULL,
  delta       BIGINT       NOT NULL,
  kind        ENUM('grant','deduct','redeem','refund','raffle') NOT NULL,
  note        VARCHAR(255) NOT NULL DEFAULT '',
  ref_id      BIGINT       NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_account (account_id, created_at),
  CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
