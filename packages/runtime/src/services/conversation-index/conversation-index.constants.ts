import { defineDoc } from '@earendil-works/pi-durable';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';

export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'bots.conversation-summary',
  version: 1,
  scope: 'session',
  initial: () => ({ conversations: {} }),
  checkpointWhen: () => false,
});

export const CONVERSATION_INDEX = {
  mentionLink: /\[([^\]\n]+)\]\((?:bot|skill|command|quote):[^)\s]+\)/gu,
  markdownLines: [
    /^ {0,3}(?:`{3,}|~{3,}).*$/gmu,
    /^ {0,3}([-*_])(?: *\1){2,} *$/gmu,
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/gmu,
  ],
  markdownPrefix: /^[ \t]*(?:>[ \t]?)*(?:#{1,6}[ \t]+|[-*+][ \t]+(?:\[[ xX]\][ \t]+)?|\d+[.)][ \t]+)?/gmu,
  markdownInline: [
    [/!?\[([^\]\n]*)\]\([^)\n]*\)/gu, '$1'],
    [/<(https?:\/\/[^>\s]+)>/gu, '$1'],
    [/(`+)([^`\n]+?)\1/gu, '$2'],
    [/(?<!\\)(\*\*|__|~~)(?=\S)(.+?)(?<=[^\s\\])\1/gu, '$2'],
    [/(?<![\w*\\])\*(?=\S)(.+?)(?<=[^\s\\])\*(?![\w*])/gu, '$1'],
    [/(?<![\w_\\])_(?=\S)(.+?)(?<=[^\s\\])_(?![\w_])/gu, '$1'],
    [/\\([\\`*_{}[\]()#+\-.!|>~])/gu, '$1'],
  ],
  tableRow: /^\|(.*?)(?<!\\)\|$/gmu,
  tableCell: /\s*(?<!\\)\|\s*/gu,
  htmlPage: /^\s*<(?:!doctype|html|[a-z][\w-]*[\s>/])/iu,
  htmlHidden: /<(script|style|head|svg)\b[\s\S]*?<\/\1>/giu,
  htmlTag: /<[^>]+>/gu,
  entities: [['&nbsp;', ' '], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'], ['&#39;', "'"], ['&amp;', '&']],
} as const;
