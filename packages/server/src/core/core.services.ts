import { makeRuntimeService } from '@openbots/runtime/server';
import { makeAuthService } from '../services/auth/auth.service';
import { makeBotService } from '../services/bot/bot.service';
import { makeCollaborationService } from '../services/collaboration/collaboration.service';
import { makeConversationService } from '../services/conversation/conversation.service';
import { makeCredentialsService } from '../services/credentials/credentials.service';
import { makeInstructionService } from '../services/instruction/instruction.service';
import { makePluginService } from '../services/plugin/plugin.service';
import { makeSkillService } from '../services/skill/skill.service';
import { makeToolService } from '../services/tool/tool.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({
  database,
  credentialsKey,
  settings,
  workspace,
  skillLoader,
  instructionLoader,
  pluginLoader,
  mcp,
  runtime: runtimeOptions,
}: CoreServicesParams) {
  const credentials = makeCredentialsService({ database, key: credentialsKey });

  const tools = makeToolService({
    database,
    credentials,
    settings,
  });

  const collaboration = makeCollaborationService({ database });

  const runtime = await makeRuntimeService({
    ...runtimeOptions,
    permissions: tools,
    collaboration,
  });

  try {
    const auth = makeAuthService({ database });
    const skill = makeSkillService({ settings, loader: skillLoader });
    const instruction = makeInstructionService({ settings, loader: instructionLoader });
    const plugin = makePluginService({ settings, loader: pluginLoader });

    const bots = makeBotService({
      database,
      runtime,
      workspace,
      skill,
      instruction,
      plugin,
      mcp,
    });

    await bots.actions.restore();
    runtime.resume();

    return {
      database,
      auth,
      bots,
      runtime,
      tools,
      skills: skill,
      instructions: instruction,
      plugins: plugin,
      mcp,
      conversation: makeConversationService({
        runtime,
        auth,
        bots,
        skill,
      }),
    };
  } catch (error) {
    await runtime.close();
    throw error;
  }
}
