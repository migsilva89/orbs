ALTER TABLE bot ADD COLUMN avatar TEXT;
ALTER TABLE bot ADD COLUMN permission TEXT NOT NULL DEFAULT 'ask';
ALTER TABLE bot ADD COLUMN inherit TEXT NOT NULL DEFAULT '["skills","mcp","plugins"]';
