import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import type { RuntimeApproval, RuntimeBotBinding } from '../../types/runtime.types';

export const runtimeToolApproval = defineDoc({
  kind: 'openbots.tool-approval',
  version: 1,
  scope: 'task',
  initial: (): { approval: RuntimeApproval | null } => ({ approval: null }),
});

export const RUNTIME_APPROVAL_TIMEOUT_MS = 300_000;

export const runtimeBot = defineDoc({
  kind: 'openbots.bot',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'current',
  initial: (): { botId: string | null; skillsPrompt: string } => ({ botId: null, skillsPrompt: '' }),
});

export const runtimeBotConversations = defineDocFamily<RuntimeBotBinding, null>({
  kind: 'openbots.bot-conversation',
  version: 1,
  scope: 'session',
  family: true,
  initial: () => ({ conversationId: null }),
});

/** Model streams running at once across all bots; later requests wait in order. */
export const RUNTIME_MAX_MODEL_REQUESTS = 4;

/** While live work runs, re-arm the host alarm so an evicted host wakes and resumes it. */
export const RUNTIME_ALARM_HEARTBEAT_MS = 60_000;

export const RUNTIME_ALARM_DEBOUNCE_MS = 1_000;
