import { EXPRESSIONS } from '@openbots/avatar-blobs/expressions';
import { BODIES, COLORS } from '@openbots/avatar-blobs/skins';
import { z } from 'zod';
import { instructionCatalog } from './instruction.types';
import { mcpCatalog } from './mcp.types';
import { pluginCatalog } from './plugin.types';
import { skill } from './skill.types';

export const botAvatar = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('blob'),
    body: z.enum(BODIES.map((body) => body.id)),
    color: z.enum(COLORS.map((color) => color.id)),
    expression: z.enum(EXPRESSIONS.map((expression) => expression.id)),
  }),
  z.object({ kind: z.literal('image'), src: z.string().max(8000).regex(/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/) }),
  z.object({ kind: z.literal('color'), color: z.string().regex(/^#[\da-f]{6}$/i) }),
  z.object({
    kind: z.literal('emoji'),
    emoji: z.string().trim().min(1).max(16),
    color: z.string().regex(/^#[\da-f]{6}$/i),
  }),
]);

export const botInherit = z.array(z.enum(['skills', 'agentsFile', 'mcp', 'plugins']))
  .max(4).transform((resources) => [...new Set(resources)]);

export const botThinkingLevel = z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);

export const botFields = z.object({
  avatar: botAvatar.nullable(),
  name: z.string().trim().min(1).max(64),
  handle: z.string().trim().toLowerCase().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  instructions: z.string().max(16000),
  modelProvider: z.string().trim().min(1).max(128),
  modelId: z.string().trim().min(1).max(128),
  thinkingLevel: botThinkingLevel,
  permission: z.enum(['read-only', 'ask', 'auto', 'full']),
  inherit: botInherit,
});

export const bot = botFields.extend({
  id: z.uuid(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const botList = z.array(bot);
export const botGet = z.object({ botId: z.uuid() });

export const botCreate = botFields.extend({
  avatar: botFields.shape.avatar.default(null),
  instructions: botFields.shape.instructions.default(''),
  thinkingLevel: botThinkingLevel.default('off'),
  permission: botFields.shape.permission.default('ask'),
  inherit: botInherit.default(['skills', 'mcp', 'plugins']),
});

export const botUpdate = botFields.partial().extend(botGet.shape);

export const botModelList = z.array(z.object({
  provider: z.string(),
  id: z.string(),
  name: z.string(),
  thinkingLevels: z.array(botThinkingLevel),
}));

export const botCatalog = z.object({
  skills: z.array(skill),
  mcp: mcpCatalog,
  plugins: pluginCatalog,
  instructions: instructionCatalog,
});

export type Bot = z.infer<typeof bot>;
export type BotCreateInput = z.infer<typeof botCreate>;
export type BotUpdateInput = z.infer<typeof botUpdate>;
export type BotGetInput = z.infer<typeof botGet>;
export type BotCatalog = z.infer<typeof botCatalog>;
