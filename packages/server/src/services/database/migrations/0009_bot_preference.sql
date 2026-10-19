CREATE TABLE bot_preference (
  bot_id TEXT PRIMARY KEY NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  is_muted INTEGER NOT NULL DEFAULT 0,
  muted_until INTEGER,
  read_through_entry_id INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
