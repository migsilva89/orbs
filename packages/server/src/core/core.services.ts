import { makeRuntimeService } from '@openbots/runtime/server';
import { makeArtifactService } from '../services/artifact/artifact.service';
import { makeAttachmentService } from '../services/attachment/attachment.service';
import { makeAuthService } from '../services/auth/auth.service';
import { makeBotService } from '../services/bot/bot.service';
import { makeCollaborationService } from '../services/collaboration/collaboration.service';
import { makeConversationService } from '../services/conversation/conversation.service';
import { makeInstructionService } from '../services/instruction/instruction.service';
import { makePluginService } from '../services/plugin/plugin.service';
import { makeRoutineService } from '../services/routine/routine.service';
import { makeServerService } from '../services/server/server.service';
import { makeSkillService } from '../services/skill/skill.service';
import { makeToolService } from '../services/tool/tool.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({
  database,
  attachmentStorage,
  credentials,
  settings,
  workspace,
  skillLoader,
  instructionLoader,
  pluginLoader,
  mcp,
  runtime: runtimeOptions,
}: CoreServicesParams) {
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
    const server = makeServerService({ settings });
    await server.queries.info();
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

    const attachments = makeAttachmentService({
      bots,
      runtime,
      storage: attachmentStorage,
    });

    runtime.actions.registerBotTools({ bots });

    await bots.actions.restore();
    runtime.resume();

    return {
      routines: makeRoutineService({ bots, runtime }),
      artifacts: makeArtifactService({ bots, runtime }),
      server,
      attachments,
      database,
      auth,
      credentials,
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
        attachments,
      }),
    };
  } catch (error) {
    await runtime.close();
    throw error;
  }
}
