import { BOT_THINKING_LEVEL_LABELS, botChooseModel, botFallbackModel, botModelKey } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Brain, Cpu, LifeBuoy, Sparkles } from 'lucide-react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { match, P } from 'ts-pattern';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { ItemGroup } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import type { MenuItem } from '@/types/menu.types';
import type { RpcSession } from '@/types/rpc.types';
import type { BotModel, BotThinkingLevel } from '@repo/client/client';
import type { BotForm, ModelSelection } from '@repo/contracts/universal';

interface BotSettingsModelProps {
  session: RpcSession;
  isDisabled: boolean;
}

export function BotSettingsModel({ session, isDisabled }: BotSettingsModelProps) {
  const form = useFormContext<BotForm>();

  const [modelProvider, modelId, thinkingLevel, fallbackModel] = useWatch({
    control: form.control,
    name: ['modelProvider', 'modelId', 'thinkingLevel', 'fallbackModel'],
  });

  const modelsQuery = useQuery({ ...session.rpc.models.list.queryOptions(), retry: false });
  const { data: providerList } = useQuery(session.rpc.providers.list.queryOptions());
  const models = modelsQuery.data ?? [];
  const primary = { modelProvider, modelId, thinkingLevel };

  const fallback = botFallbackModel({
    modelId,
    thinkingLevel,
    fallbackModel: fallbackModel ?? null,
  });

  const isSharedReasoning = fallback?.modelId === modelId;
  const isLocked = isDisabled || modelsQuery.isPending;

  const find = (selection: ModelSelection) => {
    const key = botModelKey(selection);

    return models.find((model) => botModelKey({ modelProvider: model.provider, modelId: model.id }) === key);
  };

  const modelName = (selection: ModelSelection) => match({ model: find(selection), isPending: modelsQuery.isPending })
    .with({ model: P.nonNullable }, ({ model }) => model.name)
    .with({ isPending: true }, () => m.rooms_bot_model_loading())
    .otherwise(() => m.rooms_bot_not_offered({ model: botModelKey(selection) }));

  const setPrimary = (next: ModelSelection) => {
    form.setValue('modelProvider', next.modelProvider, { shouldDirty: true });
    form.setValue('modelId', next.modelId, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    form.setValue('thinkingLevel', next.thinkingLevel, { shouldDirty: true });
    form.setValue('fallbackModel', botFallbackModel({ ...next, fallbackModel: fallbackModel ?? null }), { shouldDirty: true });
  };

  const setFallback = (next: ModelSelection | null) => form.setValue('fallbackModel', botFallbackModel({
    modelId,
    thinkingLevel,
    fallbackModel: next,
  }), { shouldDirty: true });

  const modelItems = (current: ModelSelection | null, onPick: (model: BotModel) => void): MenuItem[] => {
    const providers = [...new Set(models.map((model) => model.provider))].map((providerId): MenuItem => ({
      label: providerList?.providers.find((provider) => provider.id === providerId)?.name ?? providerId,
      systemImage: current?.modelProvider === providerId ? 'checkmark' : undefined,
      items: models.filter((model) => model.provider === providerId).map((model): MenuItem => ({
        label: model.name,
        systemImage: current && find(current) === model ? 'checkmark' : undefined,
        onSelect: () => onPick(model),
      })),
    }));

    return match(providers)
      .with([P.nonNullable], ([provider]) => provider.items ?? [])
      .otherwise(() => providers);
  };

  const levelItems = (current: ModelSelection, onPick: (level: BotThinkingLevel) => void): MenuItem[] => {
    const levels = find(current)?.thinkingLevels ?? [current.thinkingLevel];

    return levels.map((level) => ({
      label: BOT_THINKING_LEVEL_LABELS[level](),
      systemImage: level === current.thinkingLevel ? 'checkmark' : undefined,
      onSelect: () => onPick(level),
    }));
  };

  const fallbackItems = modelItems(fallback, (model) => setFallback(botChooseModel({ model, thinkingLevel: fallback?.thinkingLevel ?? thinkingLevel })));

  return (
    <BotDetailsSection
      icon={Cpu}
      title={m.rooms_bot_model()}
    >
      {match(modelsQuery.isError)
        .with(true, () => <LabelDescription accessibilityRole="alert" variant="error">{m.rooms_bot_models_error()}</LabelDescription>)
        .with(false, () => (
          <ItemGroup>
            <BotSettingsMenuRow
              icon={Sparkles}
              isDisabled={isLocked}
              items={modelItems(primary, (model) => setPrimary(botChooseModel({ model, thinkingLevel })))}
              title={m.rooms_bot_model()}
              value={modelName(primary)}
            />
            <BotSettingsMenuRow
              icon={Brain}
              isDisabled={isLocked || !find(primary)}
              items={levelItems(primary, (level) => setPrimary({ ...primary, thinkingLevel: level }))}
              title={m.rooms_bot_thinking_level()}
              value={BOT_THINKING_LEVEL_LABELS[thinkingLevel]()}
            />
            <BotSettingsMenuRow
              icon={LifeBuoy}
              isDisabled={isLocked}
              items={[
                { label: m.rooms_bot_fallback_none(), systemImage: fallback ? undefined : 'checkmark', onSelect: () => setFallback(null) },
                ...fallbackItems.map((item, index) => ({ ...item, hasDividerBefore: index === 0 })),
              ]}
              title={m.rooms_bot_fallback_model()}
              value={fallback ? modelName(fallback) : m.rooms_bot_fallback_none()}
            />
            {fallback ? (
              <BotSettingsMenuRow
                description={isSharedReasoning ? m.rooms_bot_fallback_shared_reasoning() : undefined}
                icon={Brain}
                isDisabled={isLocked || isSharedReasoning || !find(fallback)}
                items={levelItems(fallback, (level) => setFallback({ ...fallback, thinkingLevel: level }))}
                title={m.rooms_bot_fallback_thinking_level()}
                value={BOT_THINKING_LEVEL_LABELS[fallback.thinkingLevel]()}
              />
            ) : null}
          </ItemGroup>
        ))
        .exhaustive()}
    </BotDetailsSection>
  );
}
