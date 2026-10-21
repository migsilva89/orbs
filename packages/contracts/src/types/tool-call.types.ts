import { z } from 'zod';
import { artifactSummary } from './artifact.types';

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

export const toolCallArtifact = z.string().transform((text, context) => {
  try {
    return JSON.parse(text) as z.input<typeof toolCallArtifactSummary>;
  } catch {
    context.addIssue({ code: 'custom', message: 'tool_output_invalid' });
    return z.NEVER;
  }
}).pipe(toolCallArtifactSummary);

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
export type ToolCallSubagent = z.infer<typeof toolCallSubagent>;
