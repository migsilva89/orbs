import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '../forms/form';
import { PanelContent, PanelDescription, PanelRow } from '../panel';
import { Switch } from '../switch';
import type { BotInherit } from '@repo/client/client';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormInheritProps {
  resource: BotInherit
  label: string
  description: string
  busy: boolean
}

export function BotFormInherit({ resource, label, description, busy }: BotFormInheritProps) {
  const form = useFormContext<BotForm>();

  return (
    <FormField
      control={form.control}
      name="inherit"
      render={({ field }) => (
        <FormItem>
          <PanelRow>
            <PanelContent>
              <FormLabel>{label}</FormLabel>
              <PanelDescription>{description}</PanelDescription>
            </PanelContent>
            <FormControl>
              <Switch
                checked={field.value.includes(resource)}
                disabled={busy}
                onCheckedChange={(checked) => field.onChange(checked
                  ? [...field.value, resource]
                  : field.value.filter((item) => item !== resource))}
              />
            </FormControl>
          </PanelRow>
        </FormItem>
      )}
    />
  );
}
