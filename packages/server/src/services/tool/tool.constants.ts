export const TOOL = {
  jevCredential: 'typesafe.apiKey',
  approvalRulesSetting: 'tools.approvalRules',
  judgeTimeoutMs: 5000,
  judgeThreshold: 0.9,
  judgeAskThreshold: 0.1,
  judgeInputLimit: 2000,
  judgeRequestLimit: 8000,
} as const;

export const TOOL_SECRETS = [
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

export const TOOL_SECRET_VALUES = [
  /(?<keep>\b[a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+(?=@)/gi,
  /(?<keep>\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*["']?)[^\s"']{6,}/gi,
];

