-- Keep public casino scores separate from verified wagers used by milestones.
CREATE TABLE IF NOT EXISTS qboards_snapshots (
  event_id VARCHAR(24) PRIMARY KEY,
  snapshot JSON NOT NULL,
  synced_at DATETIME NOT NULL,
  INDEX idx_qboards_sync (synced_at)
) ENGINE=InnoDB;
