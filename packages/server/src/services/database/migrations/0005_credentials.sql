CREATE TABLE credentials (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
