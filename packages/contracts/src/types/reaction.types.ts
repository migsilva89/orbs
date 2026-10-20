import { z } from 'zod';
import { conversationTarget } from './conversation.types';
import { messageQuote } from './reply.types';

export const REACTION = {
  docKind: 'openbots.entry-reaction',
  entryKind: 'openbots.reaction-message',
  toolName: 'bot_react',
  /** The owner can take a reaction back this long before the bot hears about it. */
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

export const reactionMessage = z.object({ emoji: z.string().min(1).max(REACTION.maxEmoji), replyTo: messageQuote });

export const conversationSetReaction = conversationTarget.extend({
  entryId: z.number().int().positive(),
  emoji: reactionEmoji,
  isPresent: z.boolean(),
});

export const conversationBotReaction = z.object({
  botId: z.uuid(),
  emojis: z.array(reactionEmoji).max(REACTION.maxPerEntry),
});

export const conversationReaction = z.object({
  entryId: z.number().int().positive(),
  emojis: z.array(reactionEmoji).max(REACTION.maxPerEntry),
  botReactions: z.array(conversationBotReaction),
});

export const conversationSetReactionResult = conversationReaction;

export const conversationReactions = conversationTarget.extend({
  entryIds: z.array(z.number().int().positive()).max(100).refine((ids) => new Set(ids).size === ids.length),
});

export const conversationReactionsResult = z.array(conversationReaction);

export type ConversationSetReactionInput = z.infer<typeof conversationSetReaction>;
export type ConversationReactionsInput = z.infer<typeof conversationReactions>;
export type ConversationBotReaction = z.infer<typeof conversationBotReaction>;
export type ConversationReaction = z.infer<typeof conversationReaction>;
