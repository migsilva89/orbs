import { DEFAULT_EXPRESSION } from '@openbots/avatar-blobs/expressions';
import { DEFAULT_BODY, DEFAULT_COLOR } from '@openbots/avatar-blobs/skins';
import { m } from '@openbots/i18n/client';
import type * as BotTypes from '../../types/bot.types';
import type { ChatActivity } from '../../types/chat.types';
import type { ColorId } from '@openbots/avatar-blobs/skins';

export const BOT = {
  handleMaxLength: 48,
  defaultAvatar: {
    kind: 'blob',
    body: DEFAULT_BODY,
    color: DEFAULT_COLOR,
    expression: DEFAULT_EXPRESSION,
  },
} as const;

export const BOT_ACTIVITY_LABELS = {
  idle: m.avatars_activity_idle,
  queued: m.avatars_activity_queued,
  thinking: m.avatars_activity_thinking,
  working: m.avatars_activity_working,
  writing: m.avatars_activity_writing,
  compacting: m.avatars_activity_compacting,
  failed: m.avatars_activity_failed,
} satisfies Record<ChatActivity, () => string>;

export const BOT_PERMISSION_LABELS = {
  'read-only': m.rooms_bot_permission_read_only,
  ask: m.rooms_bot_permission_ask,
  auto: m.rooms_bot_permission_auto,
  full: m.rooms_bot_permission_full,
} satisfies Record<BotTypes.BotPermission, () => string>;

export const BOT_THINKING_LEVEL_LABELS = {
  off: m.rooms_bot_thinking_level_off,
  minimal: m.rooms_bot_thinking_level_minimal,
  low: m.rooms_bot_thinking_level_low,
  medium: m.rooms_bot_thinking_level_medium,
  high: m.rooms_bot_thinking_level_high,
  xhigh: m.rooms_bot_thinking_level_xhigh,
  max: m.rooms_bot_thinking_level_max,
} satisfies Record<BotTypes.BotThinkingLevel, () => string>;

export const BOT_MODEL_BRAND_PREFIXES: [RegExp, BotTypes.BotBrand][] = [
  [/^claude/u, 'anthropic'],
  [/^(gpt|o\d|codex|chatgpt)/u, 'openai'],
  [/^grok/u, 'xai'],
  [/^(gemini|gemma)/u, 'google'],
  [/^deepseek/u, 'deepseek'],
  [/^(mistral|codestral|devstral|magistral|ministral)/u, 'mistral'],
  [/^(qwen|qwq)/u, 'qwen'],
  [/^llama/u, 'meta'],
  [/^sonar/u, 'perplexity'],
];

export const BOT_PROVIDER_BRAND_PREFIXES: [RegExp, BotTypes.BotBrand][] = [
  [/^anthropic/u, 'anthropic'],
  [/^openai/u, 'openai'],
  [/^xai/u, 'xai'],
  [/^(google|gemini|vertex)/u, 'google'],
  [/^deepseek/u, 'deepseek'],
  [/^mistral/u, 'mistral'],
  [/^(qwen|alibaba|dashscope)/u, 'qwen'],
  [/^perplexity/u, 'perplexity'],
];

export const BOT_MODEL_VERSION_PATTERN = /(?<![\d.])(\d{1,3})(?:\.(\d{1,3}))?(?!\d)/u;

export const BOT_CHEER = { hoverDelayMs: 1200, pressMs: 1600, settleMs: 600 } as const;

export const BOT_BUBBLE_TEXT = {
  ink: null,
  cream: null,
  brown: 'white',
  red: 'white',
  orange: 'black',
  amber: 'black',
  green: 'black',
  turquoise: 'black',
  blue: 'white',
  violet: 'white',
  pink: 'white',
  grey: 'black',
} satisfies Record<ColorId, 'white' | 'black' | null>;
