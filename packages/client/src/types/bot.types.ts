import type { ChatActivity } from './chat.types';
import type { ExpressionId } from '@repo/avatar-blobs/expressions';
import type { BodyId, ColorId } from '@repo/avatar-blobs/skins';
import type { StateId } from '@repo/avatar-blobs/states';
import type * as UniversalTypes from '@repo/contracts/universal';

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

export interface BotBubbleParams {
  avatar: BotAvatar | undefined;
}

export interface BotBubble {
  background: string;
  foreground: 'white' | 'black';
}

export interface BotAvatarColorParams {
  avatar: BotAvatar | undefined;
}

export interface BotAvatarRecolorParams {
  avatar: BotAvatar | undefined;
  color: ColorId;
}

export interface BotAvatarEmojiParams {
  avatar: BotAvatar | undefined;
  emoji: string;
}

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

export interface BotDeleteParams {
  botId: string;
  /** Leaves the deleted bot's screens once the bot list no longer has it. */
  onDeleted: () => unknown;
}

export interface BotCreateParams {
  onCreated: (bot: UniversalTypes.Bot) => void;
}

export interface BotMcpParams {
  botId: string;
  /** Read when a login starts, so browser-only values are never touched while rendering on the server. */
  login: () => BotMcpLogin;
}

export interface BotMcpLogin {
  /** This client's server origin plus `/mcp/callback`, so the daemon receives the authorization code. */
  redirectUrl: string;
  /** Where the daemon's callback page sends the browser afterwards; omit when the login runs in a separate browser. */
  returnUrl?: string;
  /** Shows the provider's login page; resolves when the platform knows the page closed, or right away. */
  open: (authorizationUrl: string) => void | Promise<void>;
}
