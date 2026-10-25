import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import type { RuntimeBotBinding, RuntimeBotIdentity, RuntimeToolApprovalDocument } from '../../types/runtime.types';

export const runtimeToolApproval = defineDoc({
  kind: 'bots.tool-approval',
  version: 1,
  scope: 'task',
  initial: (): RuntimeToolApprovalDocument => ({ approval: null }),
  checkpointWhen: () => false,
});

export const runtimeBot = defineDoc({
  kind: 'bots.bot',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'current',
  initial: (): RuntimeBotIdentity => ({ botId: null, skillsPrompt: '' }),
  checkpointWhen: () => false,
});

export const runtimeBotConversations = defineDocFamily<RuntimeBotBinding, null>({
  kind: 'bots.bot-conversation',
  version: 1,
  scope: 'session',
  family: true,
  initial: () => ({ conversationId: null }),
  checkpointWhen: () => false,
});

export const RUNTIME_MAX_MODEL_REQUESTS = 4;

export const RUNTIME_ALARM_HEARTBEAT_MS = 60_000;

export const RUNTIME_ALARM_DEBOUNCE_MS = 1_000;

export const RUNTIME_HTML_GUIDE = [
  '# HTML pages',
  'HTML you show, as an artifact with spec.html or an html fence in a reply, renders inside the chat in a sandbox on desktop and phones. Make it look like part of the app, not a separate website.',
  'The page sits on the chat background: leave html, body and the outermost element without a background, border, shadow or banner title. Use a fluid width with no outer horizontal padding; the frame is about 360px wide on phones and wider on desktop.',
  'Style only with the app theme through CSS variables, which follow light and dark mode live: --background, --foreground, --card, --card-foreground, --popover, --popover-foreground, --primary, --primary-foreground, --secondary, --secondary-foreground, --muted, --muted-foreground, --accent, --accent-foreground, --destructive, --destructive-foreground, --success, --success-foreground, --warning, --warning-foreground, --border, --input, --ring and --radius.',
  'Do not hard-code brand colors, gradients, web fonts or a fixed dark or light page; the base stylesheet already sets the theme background, text color and system font on html, so do not reset them. For chart series, use --foreground at decreasing strength, such as color-mix(in srgb, var(--foreground) 70%, var(--background)).',
  'Give a box its own background only when it must stand apart, with at least 16px padding and var(--radius) corners. Give charts fixed pixel heights, and let content set the page height: avoid 100vh and height:100% on html or body.',
].join('\n');
