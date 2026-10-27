import { BOT_THINKING_LEVEL_LABELS, botChooseModel, botModelBrand, botModelKey } from '@repo/client/client';
import { modelThinkingLevel } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { BotBrandLogo } from '@repo/ui/bots/bot-brand-logo';
import { cn } from '@repo/ui/cn';
import { Combobox } from '@repo/ui/combobox';
import { Label } from '@repo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { rpc } from '@/services/rpc/rpc.client';
import type { BotSettings } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';
import type { ComboboxGroup } from '@repo/ui/combobox';
import type { ReactNode } from 'react';

interface BotSettingsFieldsProps {
  value: BotSettings
  fallback?: { value: Bot['fallbackModel']; onChange: (value: Bot['fallbackModel']) => void }
  disabled?: boolean
  onChange: (value: BotSettings) => void
  renderField?: (field: { slot: 'primary' | 'fallback'; label: string | null; children: ReactNode }) => ReactNode
}

export function BotSettingsFields({ value, fallback, disabled = false, onChange, renderField }: BotSettingsFieldsProps) {
  const modelsQuery = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const { data: providerList } = useQuery(rpc.providers.list.queryOptions());
  const models = modelsQuery.data ?? [];
  const modelKey = value.modelId ? botModelKey(value) : '';
  const fallbackKey = fallback?.value ? botModelKey(fallback.value) : 'none';
  const loadingModels = modelsQuery.isPending;

  if (modelsQuery.isError) {
    return <p className="text-xs text-muted-foreground">{m.rooms_bot_models_error()}</p>;
  }

  const modelGroups: ComboboxGroup[] = [...new Set(models.map((model) => model.provider))].map((providerId) => ({
    label: providerList?.providers.find((provider) => provider.id === providerId)?.name ?? providerId,
    options: models.filter((model) => model.provider === providerId).map((model) => ({
      value: botModelKey({ modelProvider: model.provider, modelId: model.id }),
      label: model.name,
      icon: <BotBrandLogo brand={botModelBrand({ providerId: model.provider, modelId: model.id })} />,
    })),
  }));

  for (const key of new Set([modelKey, ...(fallback?.value ? [fallbackKey] : [])])) {
    if (key && !loadingModels && !models.some((model) => botModelKey({ modelProvider: model.provider, modelId: model.id }) === key)) {
      modelGroups.unshift({ options: [{ value: key, label: m.rooms_bot_not_offered({ model: key }) }] });
    }
  }

  const fields = [
    {
      label: null,
      reasoningLabel: m.rooms_bot_thinking_level(),
      value,
      onChange: (next: Bot['fallbackModel']) => {
        if (next) {
          onChange(next);
        }
      },
    },
    ...(fallback ? [{ label: m.rooms_bot_fallback_model(), reasoningLabel: m.rooms_bot_fallback_thinking_level(), ...fallback }] : []),
  ];

  return (
    <div className={cn('flex flex-col', renderField ? 'gap-8' : 'gap-3')}>
      {fields.map((field) => {
        const key = field.value ? botModelKey(field.value) : 'none';
        const current = models.find((model) => botModelKey({ modelProvider: model.provider, modelId: model.id }) === key);
        const levels = current?.thinkingLevels ?? (field.value ? [field.value.thinkingLevel] : []);
        const sharedReasoning = Boolean(field.label && field.value?.modelId === value.modelId);
        const slot = field.label ? 'fallback' : 'primary';

        const pickers = (
          <>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <Combobox
                aria-label={field.label ?? m.rooms_bot_model()}
                disabled={disabled || loadingModels}
                groups={field.label ? [{ options: [{ value: 'none', label: m.rooms_bot_fallback_none() }] }, ...modelGroups] : modelGroups}
                placeholder={loadingModels ? m.rooms_bot_model_loading() : m.rooms_bot_model_pick()}
                search={{ placeholder: m.rooms_bot_model_search(), empty: m.rooms_bot_model_empty() }}
                value={key}
                onValueChange={(next) => {
                  const picked = models.find((model) => botModelKey({ modelProvider: model.provider, modelId: model.id }) === next);

                  if (picked) {
                    field.onChange(botChooseModel({ model: picked, thinkingLevel: field.value?.thinkingLevel ?? value.thinkingLevel }));
                  } else if (field.label && next === 'none') {
                    field.onChange(null);
                  }
                }}
              />
              <Select
                disabled={disabled || !current || sharedReasoning}
                value={field.value?.thinkingLevel ?? ''}
                onValueChange={(next) => {
                  if (field.value && next) {
                    field.onChange({ ...field.value, thinkingLevel: modelThinkingLevel.parse(next) });
                  }
                }}
              >
                <SelectTrigger aria-label={field.reasoningLabel}>
                  <SelectValue placeholder={m.rooms_bot_thinking_level()} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => <SelectItem key={level} value={level}>{BOT_THINKING_LEVEL_LABELS[level]()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {sharedReasoning ? <p className="text-xs text-muted-foreground">{m.rooms_bot_fallback_shared_reasoning()}</p> : null}
          </>
        );

        if (renderField) {
          return (
            <Fragment key={slot}>
              {renderField({
                slot,
                label: field.label,
                children: pickers,
              })}
            </Fragment>
          );
        }

        return (
          <div className="flex flex-col gap-2" key={slot}>
            {field.label ? <Label>{field.label}</Label> : null}
            {pickers}
          </div>
        );
      })}
    </div>
  );
}
