import { commandArguments } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import { z } from 'zod';
import type { Command } from '@openbots/contracts/universal';

const argumentsSchema = z.record(z.string(), z.json()).parse(z.toJSONSchema(commandArguments));

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
  ];
}
