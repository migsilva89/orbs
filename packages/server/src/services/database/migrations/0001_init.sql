CREATE TABLE device (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  push_token TEXT,
  push_url TEXT
);

CREATE TABLE pairing_grant (
  pin_hash TEXT PRIMARY KEY NOT NULL,
  issued_by TEXT REFERENCES device(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX pairing_grant_issued_by ON pairing_grant (issued_by);

CREATE TABLE bot (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  instructions TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  thinking_level TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  avatar TEXT,
  permission TEXT NOT NULL DEFAULT 'ask',
  inherit TEXT NOT NULL DEFAULT '["skills","mcp","plugins"]',
  fallback_model TEXT
);

CREATE TABLE credentials (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE sidebar_section (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  is_collapsed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE bot_preference (
  bot_id TEXT PRIMARY KEY NOT NULL REFERENCES bot(id) ON DELETE CASCADE,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  is_muted INTEGER NOT NULL DEFAULT 0,
  muted_until INTEGER,
  read_through_entry_id INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  when_busy TEXT,
  section_id TEXT REFERENCES sidebar_section(id) ON DELETE SET NULL
);
