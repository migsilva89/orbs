import { commandArguments, commandIdArguments } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import { z } from 'zod';
import type { Command } from '@openbots/contracts/universal';

const argumentsSchema = z.record(z.string(), z.json()).parse(z.toJSONSchema(commandArguments));
const idArgumentsSchema = z.record(z.string(), z.json()).parse(z.toJSONSchema(commandIdArguments));

export function runtimeQueryCommands(): Command[] {
  return [
    {
      name: 'compact',
      description: m.ui_command_compact_description(),
      argumentsSchema,
      argumentHint: m.ui_command_compact_argument_hint(),
    },
    {
      name: 'reset',
      description: m.ui_command_reset_description(),
      argumentsSchema,
      argumentHint: m.ui_command_reset_argument_hint(),
    },
    {
      name: 'retry',
      description: m.ui_command_retry_description(),
      argumentsSchema: idArgumentsSchema,
      argumentHint: m.ui_command_retry_argument_hint(),
    },
    {
      name: 'cancel',
      description: m.ui_command_cancel_description(),
      argumentsSchema: idArgumentsSchema,
      argumentHint: m.ui_command_cancel_argument_hint(),
    },
  ];
}
