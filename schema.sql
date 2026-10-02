-- PCForge — Cloudflare D1 schema
-- Apply with:  npm run db:schema        (remote)
--              npm run db:schema:local  (local dev)

-- Shareable builds: a short code maps to the selected components.
CREATE TABLE IF NOT EXISTS builds (
  code        TEXT PRIMARY KEY,
  items       TEXT NOT NULL,        -- JSON: { "cpu": "cpu-r7-7800x3d", ... }
  created_at  TEXT NOT NULL
);

-- Price history captured by /api/prices (best offer per component).
CREATE TABLE IF NOT EXISTS price_snapshots (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  component_id TEXT NOT NULL,
  store        TEXT NOT NULL,
  price        REAL NOT NULL,
  in_stock     INTEGER NOT NULL DEFAULT 1,
  captured_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_component ON price_snapshots (component_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured  ON price_snapshots (captured_at);
