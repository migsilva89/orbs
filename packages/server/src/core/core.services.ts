import { makeRuntimeService } from '@openbots/runtime/server';
import { makeAuthService } from '../services/auth/auth.service';
import { makeConversationService } from '../services/conversation/conversation.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({ database, ...params }: CoreServicesParams) {
  const runtime = await makeRuntimeService(params);
  const auth = makeAuthService({ database });

  return {
    database,
    auth,
    runtime,
    conversation: makeConversationService({ runtime, auth }),
  };
}
