import { defineDocFamily } from '@earendil-works/pi-durable';
import { REACTION } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeReaction } from '../../types/reaction.types';

export const runtimeReactions = defineDocFamily<RuntimeReaction, null>({
  kind: REACTION.docKind,
  version: 2,
  scope: 'conversation',
  family: true,
  history: 'latest',
  fork: 'initial',
  initial: () => ({ emojis: [], botReactions: [] }),
  migrate: (value, fromVersion) => match(fromVersion)
    .with(1, () => ({
      emojis: match(value)
        .with({ emojis: P.array(P.string) }, ({ emojis }) => [...emojis])
        .otherwise(() => []),
      botReactions: [],
    }))
    .otherwise(() => value as RuntimeReaction),
});
