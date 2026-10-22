import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import * as m from '@repo/i18n/messages';
import { match, P } from 'ts-pattern';
import {
  routineToolCreate,
  routineToolCreateParameters,
  routineToolTarget,
  routineToolTargetParameters,
  routineToolUpdate,
  routineToolUpdateParameters,
} from '../../types/runtime-routine.types';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBot } from './runtime.constants';
import type { RuntimeRoutineToolsDeps } from '../../types/runtime-routine.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';
import type { Routine } from '@repo/contracts/universal';

export function runtimeRoutineToolsExtension(deps: RuntimeRoutineToolsDeps) {
  const list = defineTool({
    name: 'bot_routine_list',
    description: m.ui_tool_bot_routine_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const target = await runtimeRoutineTarget(deps, api, context);
      return runtimeRoutineOutput(await deps.routines.queries.list(target, context));
    },
  });

  const create = defineTool({
    name: 'bot_routine_create',
    description: m.ui_tool_bot_routine_create_description(),
    parameters: routineToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolCreate.parse(params);
      const target = await runtimeRoutineTarget(deps, api, context);
      return runtimeRoutineOutput(await deps.routines.actions.create({ ...input, ...target }, context));
    },
  });

  const update = defineTool({
    name: 'bot_routine_update',
    description: m.ui_tool_bot_routine_update_description(),
    parameters: routineToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolUpdate.parse(params);
      const target = await runtimeRoutineTarget(deps, api, context);
      return runtimeRoutineOutput(await deps.routines.actions.update({ ...input, ...target }, context));
    },
  });

  const run = defineTool({
    name: 'bot_routine_run',
    description: m.ui_tool_bot_routine_run_description(),
    parameters: routineToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolTarget.parse(params);
      const target = await runtimeRoutineTarget(deps, api, context);
      return runtimeRoutineOutput(await deps.routines.actions.run({ ...input, ...target }, context));
    },
  });

  const remove = defineTool({
    name: 'bot_routine_remove',
    description: m.ui_tool_bot_routine_remove_description(),
    parameters: routineToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolTarget.parse(params);
      const target = await runtimeRoutineTarget(deps, api, context);
      await deps.routines.actions.remove({ ...input, ...target }, context);

      return { output: [{ type: 'text', text: m.ui_tool_bot_routine_removed() }] };
    },
  });

  return {
    extension: defineExtension({ name: 'bots.routine-tools', tools: [list, create, update, run, remove] }),
    readOnlyTools: [list],
  };
}

async function runtimeRoutineTarget(deps: RuntimeRoutineToolsDeps, api: ToolExecutionApi, context: Context) {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  const botId = match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });

  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return { botId, conversationId: conversation.id };
}

function runtimeRoutineOutput(value: Routine | Routine[]) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
