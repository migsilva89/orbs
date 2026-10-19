import { collaborationQueryBots } from './collaboration-query.bots';
import { collaborationQueryRecipient } from './collaboration-query.recipient';
import type { CollaborationServiceDeps } from '../../types/collaboration.types';
import type { CollaborationBotParams, CollaborationRecipientParams } from '@openbots/runtime/server';

export function makeCollaborationService(deps: CollaborationServiceDeps) {
  return {
    queries: {
      bots: (params: CollaborationBotParams) => collaborationQueryBots(deps, params),
      recipient: (params: CollaborationRecipientParams) => collaborationQueryRecipient(deps, params),
    },
  };
}
