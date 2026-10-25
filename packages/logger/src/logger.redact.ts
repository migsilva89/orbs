import type { RedactConfig } from 'evlog';

const SECRET_PATTERNS = [
  /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/g,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{22,}/g,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}/g,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}/g,
  /\bts_[A-Za-z0-9_-]{20,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

const SECRET_VALUE_PATTERNS = [
  /(?<keep>\b[a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+(?=@)/gi,
  /(?<keep>(?<![a-z0-9])(?:[a-z0-9]+[_-])*(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)["']?\s*[:=]\s*["']?)[^\s"',}]{6,}/gi,
  /(?<keep>\bbearer\s+)[A-Za-z0-9._~+/-]{8,}=*/gi,
];

const SECRET_PATHS = [
  '**.authorization',
  '**.password',
  '**.secret',
  '**.token',
  '**.apiKey',
  '**.accessToken',
  '**.refreshToken',
  '**.clientSecret',
  '*_token',
];

const REDACTED = '[redacted]';

export function redactSecrets(text: string): string {
  const keys = SECRET_PATTERNS.reduce((result, pattern) => result.replaceAll(pattern, REDACTED), text);

  return SECRET_VALUE_PATTERNS.reduce((result, pattern) => result.replaceAll(pattern, `$<keep>${REDACTED}`), keys);
}

export const LOG_REDACT: RedactConfig = {
  paths: SECRET_PATHS,
  patterns: [...SECRET_PATTERNS, ...SECRET_VALUE_PATTERNS],
  builtins: ['jwt', 'bearer'],
  replacement: (_matched, { groups }) => `${groups?.[0] ?? ''}${REDACTED}`,
};
