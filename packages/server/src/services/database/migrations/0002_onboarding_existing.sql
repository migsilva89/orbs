-- Servers set up before onboarding existed already have bots: count them as onboarded.
INSERT OR IGNORE INTO settings (key, value, updated_at)
SELECT 'onboarding.completedAt', CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE EXISTS (SELECT 1 FROM bot);
