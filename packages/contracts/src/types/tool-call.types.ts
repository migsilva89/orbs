import { z } from 'zod';
import { artifactSummary } from './artifact.types';
import { bot } from './bot.types';
import { routine } from './routine.types';
import { todo } from './todo.types';

/** Shapes of Pi tool call inputs and outputs as clients render them. */
export const toolCallJson = z.record(z.string(), z.json());

export const toolCallText = z.string();

export const toolCallValue = z.union([
  z.string().transform((text) => ({ kind: 'text' as const, text })),
  z.boolean().transform((flag) => ({ kind: 'flag' as const, flag })),
  z.number().transform((number) => ({ kind: 'number' as const, number })),
  z.array(z.json()).transform((items) => ({ kind: 'list' as const, items })),
  toolCallJson.transform((fields) => ({ kind: 'fields' as const, fields })),
]);

const toolCallEdit = z.object({ oldText: z.string(), newText: z.string() });

export const toolCallEdits = z.array(toolCallEdit);

const toolCallArtifactSummary = artifactSummary.pick({
  id: true,
  botId: true,
  conversationId: true,
  title: true,
  version: true,
});

/** A tool output that is the JSON text of one value, read with `schema`; text that is not JSON fails `schema`. */
function toolCallJsonOutput<T extends z.ZodType>(schema: T) {
  return z.preprocess((text) => {
    try {
      return typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      return text;
    }
  }, schema);
}

export const toolCallArtifact = toolCallJsonOutput(toolCallArtifactSummary);

export const toolCallRoutine = toolCallJsonOutput(routine.pick({ id: true, name: true }));

export const toolCallTodo = toolCallJsonOutput(todo.pick({ id: true, title: true }));

export const toolCallBot = toolCallJsonOutput(bot.pick({ id: true, name: true }));

export const toolCallSubagent = z.object({
  operation: z.enum(['run', 'spawn', 'send']),
  name: z.string().optional(),
  message: z.string().min(1),
});

export const toolCallSubagentDetails = z.object({ conversationId: z.number().int().positive() });

export const toolCallPeerDetails = z.object({ recipientId: z.uuid(), recipientConversationId: z.number().int().positive() });

export type ToolCallJson = z.infer<typeof toolCallJson>;
export type ToolCallJsonValue = ToolCallJson[string];
export type ToolCallArtifact = z.infer<typeof toolCallArtifact>;
export type ToolCallRoutine = z.infer<typeof toolCallRoutine>;
export type ToolCallTodo = z.infer<typeof toolCallTodo>;
export type ToolCallBot = z.infer<typeof toolCallBot>;
export type ToolCallSubagent = z.infer<typeof toolCallSubagent>;
