import { defineDocFamily } from '@earendil-works/pi-durable';
import { REACTION } from '@openbots/contracts/universal';
import type { RuntimeReaction } from '../../types/reaction.types';

export const runtimeReactions = defineDocFamily<RuntimeReaction, null>({
  kind: REACTION.docKind,
  version: 1,
  scope: 'conversation',
  family: true,
  history: 'latest',
  fork: 'initial',
  initial: () => ({ emojis: [] }),
});
