-- Recent Kick chat activity received through the official webhook: proof the
-- webhook is delivering, and the outcome of every !join for the dashboard.
CREATE TABLE IF NOT EXISTS kick_chat_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(191) NOT NULL,
  content VARCHAR(500) NOT NULL,
  outcome VARCHAR(40) NULL,
  slot VARCHAR(191) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kick_chat_created (created_at)
) ENGINE=InnoDB;
