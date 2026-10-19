import type { ChatActivity } from '@/types/chat.types';
import type { ExpressionId } from '@openbots/avatar-blobs/expressions';
import type { BodyId, ColorId } from '@openbots/avatar-blobs/skins';
import type { StateId } from '@openbots/avatar-blobs/states';
import type * as UniversalTypes from '@openbots/contracts/universal';
import type { CSSProperties } from 'react';

export type BotBrand = 'anthropic' | 'openai' | 'xai' | 'google' | 'deepseek' | 'mistral' | 'qwen' | 'meta' | 'perplexity';

export type BotAvatar = UniversalTypes.Bot['avatar'];

export type BotModel = UniversalTypes.ModelList[number];

export type BotThinkingLevel = UniversalTypes.ModelSelection['thinkingLevel'];

export type BotPermission = UniversalTypes.Bot['permission'];

export type BotInherit = UniversalTypes.Bot['inherit'][number];

export interface BotBlobPresentation {
  body: BodyId;
  color: ColorId;
  expression: ExpressionId;
  state: StateId;
}

export interface BotHandleParams {
  name: string;
}

export interface BotSkillNameParams {
  name: string;
}

export interface BotModelBrandParams {
  providerId: string;
  modelId: string;
}

export interface BotBubbleStyleParams {
  avatar: BotAvatar | undefined;
}

export type BotBubbleStyle = CSSProperties & { '--bubble': string; '--bubble-foreground': string };

export interface BotBlobPresentationParams {
  avatar: BotAvatar | undefined;
  activity: ChatActivity;
}

export type BotSettings = Pick<UniversalTypes.Bot, 'modelProvider' | 'modelId' | 'thinkingLevel'>;

export interface BotModelUsage {
  model: UniversalTypes.BotSwapModelsInput['from'];
  primary: UniversalTypes.Bot[];
  fallbacks: UniversalTypes.Bot[];
}

export interface BotModelUsageParams {
  bots: UniversalTypes.Bot[];
}

export interface BotChooseModelParams {
  model: BotModel;
  thinkingLevel: BotThinkingLevel;
}

export interface BotDefaultSettingsParams {
  models: BotModel[];
  thinkingLevel: BotThinkingLevel;
}
