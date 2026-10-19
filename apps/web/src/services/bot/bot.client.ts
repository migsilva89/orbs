import { COLOR_BY_ID } from '@openbots/avatar-blobs/skins';
import { getLocale, m } from '@openbots/i18n/client';
import { match, P } from 'ts-pattern';
import {
  BOT,
  BOT_BUBBLE_TEXT,
  BOT_MODEL_BRAND_PREFIXES,
  BOT_MODEL_VERSION_PATTERN,
  BOT_PROVIDER_BRAND_PREFIXES,
} from './bot.constants';
import type * as BotTypes from '@/types/bot.types';
import type { ChatActivity, ChatUsage } from '@/types/chat.types';
import type { ExpressionId } from '@openbots/avatar-blobs/expressions';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function botSkillName({ name }: BotTypes.BotSkillNameParams): string {
  return name
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function botHandle({ name }: BotTypes.BotHandleParams): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/gu, '')
    .trim()
    .replaceAll(/[\s-]+/gu, '-')
    .slice(0, BOT.handleMaxLength)
    .replaceAll(/^-+|-+$/gu, '');
}

export function botFallbackModel({ modelId, thinkingLevel, fallbackModel }: Pick<UniversalTypes.Bot, 'modelId' | 'thinkingLevel' | 'fallbackModel'>): UniversalTypes.Bot['fallbackModel'] {
  return fallbackModel?.modelId === modelId ? { ...fallbackModel, thinkingLevel } : fallbackModel;
}

export function botModelBrand({ providerId, modelId }: BotTypes.BotModelBrandParams): BotTypes.BotBrand | null {
  function botBrandMatch(prefixes: [RegExp, BotTypes.BotBrand][], id: string): BotTypes.BotBrand | null {
    const bare = id.toLowerCase().split('/').at(-1) ?? '';

    return prefixes.find(([pattern]) => pattern.test(bare))?.[1] ?? null;
  }

  return botBrandMatch(BOT_MODEL_BRAND_PREFIXES, modelId) ?? botBrandMatch(BOT_PROVIDER_BRAND_PREFIXES, providerId);
}

export function botModelKey({ modelProvider, modelId }: Pick<UniversalTypes.ModelSelection, 'modelProvider' | 'modelId'>): string {
  return `${modelProvider}/${modelId}`;
}

export function botChooseModel({ model, thinkingLevel }: BotTypes.BotChooseModelParams): BotTypes.BotSettings {
  const supported = model.thinkingLevels;

  return {
    modelProvider: model.provider,
    modelId: model.id,
    thinkingLevel: supported.includes(thinkingLevel) ? thinkingLevel : (supported.at(0) ?? thinkingLevel),
  };
}

export function botDefaultSettings({ models, thinkingLevel }: BotTypes.BotDefaultSettingsParams): BotTypes.BotSettings {
  function botModelVersion(model: BotTypes.BotModel): [number, number] {
    const version = BOT_MODEL_VERSION_PATTERN.exec(model.name) ?? BOT_MODEL_VERSION_PATTERN.exec(model.id);

    return version ? [Number(version[1]), Number(version.at(2) ?? 0)] : [0, 0];
  }

  function botModelNewer(candidate: BotTypes.BotModel, best: BotTypes.BotModel): boolean {
    const [major, minor] = botModelVersion(candidate);
    const [bestMajor, bestMinor] = botModelVersion(best);

    return major > bestMajor || (major === bestMajor && minor > bestMinor);
  }

  const newest = models.reduce<BotTypes.BotModel | null>((best, model) => (!best || botModelNewer(model, best) ? model : best), null);

  return match(newest)
    .with(P.nonNullable, (model) => botChooseModel({ model, thinkingLevel }))
    .otherwise(() => ({ modelProvider: '', modelId: '', thinkingLevel }));
}

export function botBlobPresentation({ avatar, activity }: BotTypes.BotBlobPresentationParams): BotTypes.BotBlobPresentation {
  const look = match(avatar)
    .with({ kind: 'blob' }, (blob) => blob)
    .otherwise(() => BOT.defaultAvatar);

  const expressions = {
    idle: look.expression,
    queued: 'curious',
    thinking: 'attentive',
    working: 'attentive',
    writing: 'attentive',
    compacting: 'attentive',
    failed: 'sad',
  } satisfies Record<ChatActivity, ExpressionId>;

  return { ...look, expression: expressions[activity], state: activity === 'working' || activity === 'compacting' ? 'swirl' : 'idle' };
}

export function botBubbleStyle({ avatar }: BotTypes.BotBubbleStyleParams): BotTypes.BotBubbleStyle | undefined {
  const blob = match(avatar)
    .with({ kind: 'blob' }, (value) => value)
    .otherwise(() => BOT.defaultAvatar);

  const color = COLOR_BY_ID.get(blob.color);
  const text = color && BOT_BUBBLE_TEXT[color.id];

  return color && text ? { '--bubble': color.hex, '--bubble-foreground': text } : undefined;
}

export function botUsageLabel(usage: ChatUsage): string {
  const tokens = new Intl.NumberFormat(getLocale(), { notation: 'compact' });
  const label = m.rooms_chat_usage({ input: tokens.format(usage.input + usage.cacheRead), output: tokens.format(usage.output) });

  return match(usage.cost.total > 0)
    .with(false, () => label)
    .with(true, () => m.rooms_chat_usage_cost({
      usage: label,
      cost: new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: 'USD',
        maximumSignificantDigits: 2,
      }).format(usage.cost.total),
    }))
    .exhaustive();
}

export function botModelUsage({ bots }: BotTypes.BotModelUsageParams): Map<string, BotTypes.BotModelUsage> {
  const models = new Map<string, BotTypes.BotModelUsage>();

  for (const bot of bots) {
    for (const field of ['primary', 'fallbacks'] as const) {
      const model = field === 'primary' ? bot : bot.fallbackModel;

      if (model) {
        const key = botModelKey(model);
        const usage = models.get(key) ?? { model: { modelProvider: model.modelProvider, modelId: model.modelId }, primary: [], fallbacks: [] };
        usage[field].push(bot);
        models.set(key, usage);
      }
    }
  }

  return models;
}
