import * as m from '@repo/i18n/messages';
import { runtimeCommandArgumentsSchema, runtimeCommandIdArgumentsSchema } from '../../types/runtime.types';
import type { Command } from '@repo/contracts/universal';

export function runtimeQueryCommands(): Command[] {
  return [
    {
      name: 'compact',
      description: m.ui_command_compact_description(),
      argumentsSchema: runtimeCommandArgumentsSchema,
      argumentHint: m.ui_command_compact_argument_hint(),
    },
    {
      name: 'reset',
      description: m.ui_command_reset_description(),
      argumentsSchema: runtimeCommandArgumentsSchema,
      argumentHint: m.ui_command_reset_argument_hint(),
    },
    {
      name: 'retry',
      description: m.ui_command_retry_description(),
      argumentsSchema: runtimeCommandIdArgumentsSchema,
      argumentHint: m.ui_command_retry_argument_hint(),
    },
    {
      name: 'cancel',
      description: m.ui_command_cancel_description(),
      argumentsSchema: runtimeCommandIdArgumentsSchema,
      argumentHint: m.ui_command_cancel_argument_hint(),
    },
  ];
}
