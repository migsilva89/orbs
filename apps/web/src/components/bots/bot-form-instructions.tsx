import { m } from '@openbots/i18n/client';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { PanelRow } from '@/components/ui/panel';
import { Textarea } from '@/components/ui/textarea';
import IconMessageSquareText from '~icons/lucide/message-square-text';
import type { BotForm } from '@openbots/contracts/universal';

export function BotFormInstructions() {
  const form = useFormContext<BotForm>();

  return (
    <PanelRow className="items-start">
      <IconMessageSquareText />
      <div className="min-w-0 flex-1">
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.rooms_bot_instructions()}</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-40"
                  maxLength={16000}
                  placeholder={m.rooms_bot_instructions_placeholder()}
                  {...field}
                />
              </FormControl>
              <FormErrorsAndHint />
            </FormItem>
          )}
        />
      </div>
    </PanelRow>
  );
}
