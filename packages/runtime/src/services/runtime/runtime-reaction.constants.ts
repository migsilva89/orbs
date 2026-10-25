import { defineDocFamily } from '@earendil-works/pi-durable';
import { REACTION } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeReaction } from '../../types/runtime-reaction.types';

export const runtimeReactions = defineDocFamily<RuntimeReaction, null>({
  kind: REACTION.docKind,
  version: 2,
  scope: 'conversation',
  family: true,
  history: 'latest',
  fork: 'initial',
  initial: () => ({ emojis: [], botReactions: [] }),
  migrate: (value, fromVersion) => ({
    emojis: match(value)
      .with({ emojis: P.array(P.string) }, ({ emojis }) => [...emojis])
      .otherwise(() => []),
    botReactions: match({ value, fromVersion })
      .with({ fromVersion: 1 }, () => [])
      .with({ value: { botReactions: P.array({ botId: P.string, emojis: P.array(P.string) }) } }, ({ value: { botReactions } }) => (
        botReactions.map((reaction) => ({ botId: reaction.botId, emojis: [...reaction.emojis] }))
      ))
      .otherwise(() => []),
  }),
  checkpointWhen: () => false,
});
