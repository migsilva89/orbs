import { z } from 'zod';
import { conversationTarget } from './conversation.types';

export const commandList = conversationTarget;
export const commandArguments = z.string().max(64000);

export const command = z.object({
  name: z.string().min(1),
  description: z.string(),
  argumentsSchema: z.record(z.string(), z.json()),
  argumentHint: z.string().nullable(),
});

export const commandCatalog = z.array(command);

export const commandExecute = commandList.extend({
  name: z.string().min(1).max(64),
  arguments: commandArguments.optional(),
});

export const commandExecuteResult = z.void();

export type Command = z.infer<typeof command>;
export type CommandExecuteInput = z.infer<typeof commandExecute>;
