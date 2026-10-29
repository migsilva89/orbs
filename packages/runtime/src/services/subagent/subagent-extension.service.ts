import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import { match, P } from 'ts-pattern';
import { subagentActionRun } from './subagent-action.run';
import { subagentActionSend } from './subagent-action.send';
import { subagentActionSpawn } from './subagent-action.spawn';
import { subagentActionStop } from './subagent-action.stop';
import { subagentAnchorTask } from './subagent-anchor.task';
import { subagentQueryStatus } from './subagent-query.status';
import { subagentReporterTask } from './subagent-reporter.task';
import { SUBAGENT } from './subagent.constants';
import { subagentReply } from './subagent.utils';

const subagentName = Type.String({
  minLength: 1,
  maxLength: 64,
  pattern: '^[A-Za-z0-9][A-Za-z0-9_-]*$',
  description: 'Name of the background subagent.',
});

const subagentMessage = Type.String({
  minLength: 1,
  maxLength: 64_000,
  description: 'Message for the subagent.',
});

export function makeSubagentExtensionService() {
  const extension = defineExtension({
    name: SUBAGENT.extension,
    tasks: [subagentAnchorTask, subagentReporterTask],
    tools: [
      defineTool({
        name: SUBAGENT.tool,
        description: m.ui_tool_bot_subagent_description(),
        parameters: Type.Object({
          operation: Type.Union([
            Type.Literal('run'),
            Type.Literal('spawn'),
            Type.Literal('send'),
            Type.Literal('status'),
          ]),
          name: Type.Optional(subagentName),
          message: Type.Optional(subagentMessage),
          whenBusy: Type.Optional(Type.Union([Type.Literal('steer'), Type.Literal('followUp')])),
        }),
        replay: 'safe',
        execute: async (args, api, context) => match(args)
          .with({ operation: 'run', message: P.string }, ({ message }) => (
            subagentActionRun({
              api,
              message,
              context,
            })
          ))
          .with({ operation: 'run' }, () => subagentReply('run needs a message.', undefined, true))
          .with({
            operation: 'spawn',
            name: P.string,
            message: P.string,
          }, ({ name, message }) => (
            subagentActionSpawn({
              api,
              name,
              message,
              context,
            })
          ))
          .with({ operation: 'spawn' }, () => subagentReply('spawn needs a name and message.', undefined, true))
          .with({
            operation: 'send',
            name: P.string,
            message: P.string,
          }, ({ name, message }) => (
            subagentActionSend({
              api,
              name,
              message,
              whenBusy: args.whenBusy,
              context,
            })
          ))
          .with({ operation: 'send' }, () => subagentReply('send needs a name and message.', undefined, true))
          .with({ operation: 'status' }, ({ name }) => subagentQueryStatus({
            api,
            name,
            context,
          }))
          .exhaustive(),
      }),
      defineTool({
        name: SUBAGENT.stop,
        description: m.ui_tool_bot_subagent_stop_description(),
        parameters: Type.Object({ name: subagentName }),
        replay: 'unsafe',
        execute: ({ name }, api, context) => subagentActionStop({
          api,
          name,
          context,
        }),
      }),
    ],
  });

  return { extension };
}

export type SubagentExtensionService = ReturnType<typeof makeSubagentExtensionService>;
