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
} from '../../types/routine-tool.types';
import { runtimeToolBotTarget, runtimeToolOutput } from './runtime-tool.utils';
import type { RoutineToolDeps } from '../../types/routine-tool.types';

export function runtimeRoutineToolsExtension(deps: RoutineToolDeps) {
  const list = defineTool({
    name: 'bot_routine_list',
    description: m.ui_tool_bot_routine_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const target = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.routines.queries.list(target, context));
    },
  });

  const create = defineTool({
    name: 'bot_routine_create',
    description: m.ui_tool_bot_routine_create_description(),
    parameters: routineToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolCreate.parse(params);
      const target = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.routines.actions.create({ ...input, ...target }, context));
    },
  });

  const update = defineTool({
    name: 'bot_routine_update',
    description: m.ui_tool_bot_routine_update_description(),
    parameters: routineToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolUpdate.parse(params);
      const target = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.routines.actions.update({ ...input, ...target }, context));
    },
  });

  const run = defineTool({
    name: 'bot_routine_run',
    description: m.ui_tool_bot_routine_run_description(),
    parameters: routineToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolTarget.parse(params);
      const target = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.routines.actions.run({ ...input, ...target }, context));
    },
  });

  const remove = defineTool({
    name: 'bot_routine_remove',
    description: m.ui_tool_bot_routine_remove_description(),
    parameters: routineToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = routineToolTarget.parse(params);
      const target = await runtimeToolBotTarget(deps, api, context);

      const removed = match((await deps.routines.queries.list(target, context)).find((routine) => routine.id === input.routineId))
        .with(P.nonNullable, (routine) => routine)
        .otherwise(() => {
          throw new Errors.NOT_FOUND({ resource: 'routine', resourceId: input.routineId });
        });

      await deps.routines.actions.remove({ ...input, ...target }, context);

      return runtimeToolOutput(removed);
    },
  });

  return {
    extension: defineExtension({ name: 'bots.routine-tools', tools: [list, create, update, run, remove] }),
    readOnlyTools: [list],
  };
}
