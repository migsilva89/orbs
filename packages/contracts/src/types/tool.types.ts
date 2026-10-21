import { z } from 'zod';

export const toolApprovalRules = z.array(z.object({
  when: z.string().trim().min(1).max(300),
  behavior: z.enum(['allow', 'ask']),
})).max(50);

export const toolSettings = z.object({
  isJevConfigured: z.boolean(),
  approvalRules: toolApprovalRules,
});

export const toolConfigure = toolSettings.pick({ approvalRules: true }).extend({
  jevApiKey: z.string().trim().min(1).max(8192).nullable(),
}).partial();

export const toolPending = z.object({ botId: z.uuid() });

export const toolApproval = z.object({
  id: z.number().int().positive(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  toolName: z.string(),
  arguments: z.json(),
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
});

export const toolApprovalList = z.array(toolApproval);

export const toolAlwaysAllowed = z.array(z.string().min(1).max(200)).max(200);

export const toolAnswer = toolPending.extend({
  id: z.number().int().positive(),
  approved: z.boolean(),
  always: z.boolean().optional(),
});

export const toolAnswerResult = z.object({ accepted: z.boolean() });

export const toolSettingsForm = z.object({
  approvalRules: toolApprovalRules,
  jevApiKey: z.string().trim().max(8192),
});

export type ToolConfigureInput = z.infer<typeof toolConfigure>;
export type ToolSettings = z.infer<typeof toolSettings>;
export type ToolPendingInput = z.infer<typeof toolPending>;
export type ToolApproval = z.infer<typeof toolApproval>;
export type ToolAnswerInput = z.infer<typeof toolAnswer>;
export type ToolSettingsForm = z.infer<typeof toolSettingsForm>;
export type ToolApprovalRule = z.infer<typeof toolApprovalRules>[number];
