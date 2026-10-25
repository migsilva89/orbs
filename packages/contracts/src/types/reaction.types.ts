import { z } from 'zod';

export const REACTION = {
  docKind: 'bots.entry-reaction',
  entryKind: 'bots.reaction-message',
  toolName: 'bot_react',
  deliverMs: 2000,
  maxPerEntry: 20,
  maxEmoji: 64,
} as const;

const reactionSymbol = '(?:\\p{Regional_Indicator}{2}|\\p{Emoji}\\uFE0F?\\u20E3|\\p{Extended_Pictographic}\\uFE0F?\\p{Emoji_Modifier}?)';
const reactionEmojiPattern = new RegExp(`^(?:${reactionSymbol})(?:\\u200D(?:${reactionSymbol}))*$`, 'u');

export const reactionEmoji = z.string().min(1).max(REACTION.maxEmoji).refine((value) => {
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)];

  return graphemes.length === 1 && reactionEmojiPattern.test(value);
});
