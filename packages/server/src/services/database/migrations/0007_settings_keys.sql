UPDATE settings SET key = 'skills.directories'
WHERE key = 'resources.skillDirs'
  AND NOT EXISTS (SELECT 1 FROM settings AS existing WHERE existing.key = 'skills.directories');

DELETE FROM settings WHERE key = 'resources.skillDirs';

UPDATE settings SET key = 'mcp.paths'
WHERE key = 'resources.mcpPaths'
  AND NOT EXISTS (SELECT 1 FROM settings AS existing WHERE existing.key = 'mcp.paths');

DELETE FROM settings WHERE key = 'resources.mcpPaths';
