CREATE TABLE bot (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  instructions TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  thinking_level TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
