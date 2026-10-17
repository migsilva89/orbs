import { makeRuntimeService } from '@openbots/runtime/server';
import { makeAuthService } from '../services/auth/auth.service';
import { makeBotService } from '../services/bot/bot.service';
import { makeConversationService } from '../services/conversation/conversation.service';
import { makeCredentialsService } from '../services/credentials/credentials.service';
import { makeResourceService } from '../services/resource/resource.service';
import { makeToolService } from '../services/tool/tool.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({ database, credentialsKey, resourceDriver, runtime: runtimeOptions }: CoreServicesParams) {
  const credentials = makeCredentialsService({ database, key: credentialsKey });
  const tools = makeToolService({ database, credentials });
  const runtime = await makeRuntimeService({ ...runtimeOptions, permissions: tools });

  try {
    const auth = makeAuthService({ database });
    const resources = makeResourceService({ database, driver: resourceDriver });

    const bots = makeBotService({
      database,
      runtime,
      resources,
    });

    await bots.actions.restore();
    runtime.resume();

    return {
      database,
      auth,
      bots,
      runtime,
      tools,
      resources,
      conversation: makeConversationService({
        runtime,
        auth,
        bots,
      }),
    };
  } catch (error) {
    await runtime.close();
    throw error;
  }
}
