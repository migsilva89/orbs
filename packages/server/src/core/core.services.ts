import { makeRuntimeService } from '@repo/runtime/server';
import { makeArtifactService } from '../services/artifact/artifact.service';
import { makeAttachmentService } from '../services/attachment/attachment.service';
import { makeAuthService } from '../services/auth/auth.service';
import { makeAvatarService } from '../services/avatar/avatar.service';
import { makeBotService } from '../services/bot/bot.service';
import { makeCollaborationService } from '../services/collaboration/collaboration.service';
import { makeConversationService } from '../services/conversation/conversation.service';
import { makeInstructionService } from '../services/instruction/instruction.service';
import { makeLimitService } from '../services/limit/limit.service';
import { makeMcpAuthService } from '../services/mcp/mcp-auth.service';
import { makeNotificationService } from '../services/notification/notification.service';
import { makePluginService } from '../services/plugin/plugin.service';
import { makeRoutineService } from '../services/routine/routine.service';
import { makeServerService } from '../services/server/server.service';
import { makeSkillService } from '../services/skill/skill.service';
import { makeTodoService } from '../services/todo/todo.service';
import { makeToolService } from '../services/tool/tool.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({
  database,
  attachmentStorage,
  avatarImages,
  credentials,
  secrets,
  settings,
  workspace,
  skillLoader,
  instructionLoader,
  pluginLoader,
  mcp,
  mcpAuth,
  providers,
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
    const limits = makeLimitService({ settings });
    await limits.ready;
    auth.onRevoke((deviceId) => {
      providers.actions.cancelDevice({ deviceId });
      mcpAuth.actions.cancelDevice({ deviceId });
    });
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

    const notifications = makeNotificationService({
      database,
      runtime,
      bots,
      settings,
    });

    await bots.actions.restore();
    runtime.resume();

    return {
      routines: makeRoutineService({ bots, runtime }),
      todos: makeTodoService({ bots, runtime }),
      artifacts: makeArtifactService({ bots, runtime }),
      notifications,
      server,
      limits,
      providers,
      mcpAuth: makeMcpAuthService({
        bots,
        mcp,
        oauth: mcpAuth,
        auth,
      }),
      attachments,
      avatars: makeAvatarService({ bots, images: avatarImages }),
      database,
      auth,
      credentials,
      secrets,
      bots,
      runtime,
      tools,
      skills: skill,
      instructions: instruction,
      plugins: plugin,
      mcp,
      conversation: makeConversationService({
        notifications,
        runtime,
        auth,
        bots,
        secrets,
        settings,
        skill,
        attachments,
        tools,
      }),
    };
  } catch (error) {
    await runtime.close();
    throw error;
  }
}
