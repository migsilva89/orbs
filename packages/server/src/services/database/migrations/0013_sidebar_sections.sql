CREATE TABLE sidebar_section (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  is_collapsed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

ALTER TABLE bot_preference ADD COLUMN section_id TEXT REFERENCES sidebar_section(id) ON DELETE SET NULL;
