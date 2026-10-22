import { BOT, botHandle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormControl, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { FormInput } from '@/components/ui/forms/form-input';
import { Input } from '@/components/ui/input';
import type { BotForm } from '@repo/contracts/universal';

export function BotFormProfile() {
  const form = useFormContext<BotForm>();
  const name = useWatch({ control: form.control, name: 'name' });

  return (
    <div className="grid items-start gap-4 @md/panel:grid-cols-2">
      <FormInput
        required
        label={m.rooms_bot_name()}
        maxLength={64}
        name="name"
        placeholder={m.rooms_bot_default_name()}
      />
      <FormField
        control={form.control}
        name="handle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{m.rooms_bot_handle()}</FormLabel>
            <FormControl>
              <Input
                maxLength={BOT.handleMaxLength}
                placeholder={botHandle({ name }) || m.rooms_bot_handle_placeholder()}
                {...field}
                value={field.value}
              />
            </FormControl>
            <FormErrorsAndHint />
          </FormItem>
        )}
      />
    </div>
  );
}
