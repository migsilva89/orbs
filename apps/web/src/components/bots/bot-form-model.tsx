import { botFallbackModel } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { FormErrorsAndHint, FormField, FormItem, FormLabel } from '@repo/ui/forms/form';
import { PanelRow } from '@repo/ui/panel';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { useFormContext, useWatch } from 'react-hook-form';
import { BotSettingsFields } from '@/components/bots/bot-settings-fields';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormModelProps {
  busy: boolean
  isGrouped?: boolean
}

export function BotFormModel({ busy, isGrouped = false }: BotFormModelProps) {
  const form = useFormContext<BotForm>();
  const [modelProvider, modelId, thinkingLevel, fallbackModel] = useWatch({ control: form.control, name: ['modelProvider', 'modelId', 'thinkingLevel', 'fallbackModel'] });

  return (
    <FormField
      control={form.control}
      name="modelId"
      render={() => (
        <FormItem>
          <FormLabel className={isGrouped ? 'sr-only' : undefined}>{m.rooms_bot_model()}</FormLabel>
          <BotSettingsFields
            disabled={busy}
            fallback={{
              value: botFallbackModel({
                modelId,
                thinkingLevel,
                fallbackModel: fallbackModel ?? null,
              }),
              onChange: (next) => form.setValue('fallbackModel', botFallbackModel({
                modelId,
                thinkingLevel,
                fallbackModel: next,
              }), { shouldDirty: true, shouldValidate: form.formState.isSubmitted }),
            }}
            renderField={isGrouped
              ? ({ slot, label, children }) => (
                <SettingsGroup isTitleVisible title={label ?? m.bots_model_main()}>
                  <PanelRow className="block">
                    <div className="flex flex-col gap-2">
                      {children}
                      {slot === 'primary' ? <FormErrorsAndHint /> : null}
                    </div>
                  </PanelRow>
                </SettingsGroup>
              )
              : undefined}
            value={{ modelProvider, modelId, thinkingLevel }}
            onChange={(next) => {
              form.setValue('modelProvider', next.modelProvider, { shouldDirty: true });
              form.setValue('modelId', next.modelId, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
              form.setValue('thinkingLevel', next.thinkingLevel, { shouldDirty: true });
              form.setValue('fallbackModel', botFallbackModel({ ...next, fallbackModel: fallbackModel ?? null }), { shouldDirty: true });
            }}
          />
          {isGrouped ? null : <FormErrorsAndHint />}
        </FormItem>
      )}
    />
  );
}
