import { botFallbackModel } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useFormContext, useWatch } from 'react-hook-form';
import { BotSettingsFields } from '@/components/bots/bot-settings-fields';
import { FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormModelProps {
  busy: boolean
}

export function BotFormModel({ busy }: BotFormModelProps) {
  const form = useFormContext<BotForm>();
  const [modelProvider, modelId, thinkingLevel, fallbackModel] = useWatch({ control: form.control, name: ['modelProvider', 'modelId', 'thinkingLevel', 'fallbackModel'] });

  return (
    <FormField
      control={form.control}
      name="modelId"
      render={() => (
        <FormItem>
          <FormLabel>{m.rooms_bot_model()}</FormLabel>
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
            value={{ modelProvider, modelId, thinkingLevel }}
            onChange={(next) => {
              form.setValue('modelProvider', next.modelProvider, { shouldDirty: true });
              form.setValue('modelId', next.modelId, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
              form.setValue('thinkingLevel', next.thinkingLevel, { shouldDirty: true });
              form.setValue('fallbackModel', botFallbackModel({ ...next, fallbackModel: fallbackModel ?? null }), { shouldDirty: true });
            }}
          />
          <FormErrorsAndHint />
        </FormItem>
      )}
    />
  );
}
