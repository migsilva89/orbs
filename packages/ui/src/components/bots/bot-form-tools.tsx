import { m } from '@repo/i18n/client';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel } from '../forms/form';
import { PanelRow } from '../panel';
import { SettingsGroup } from '../settings/settings-group';
import { BotFormInherit } from './bot-form-inherit';
import { BotPermissionSelect } from './bot-permission-select';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormToolsProps {
  busy: boolean
}

export function BotFormTools({ busy }: BotFormToolsProps) {
  const form = useFormContext<BotForm>();

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup isTitleVisible title={m.rooms_bot_permission()}>
        <PanelRow className="block">
          <FormField
            control={form.control}
            name="permission"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{m.rooms_bot_permission()}</FormLabel>
                <BotPermissionSelect
                  disabled={busy}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </PanelRow>
      </SettingsGroup>
      <SettingsGroup isTitleVisible title={m.bots_shared()}>
        <BotFormInherit
          busy={busy}
          description={m.bots_plugins_hint()}
          label={m.rooms_bot_global_plugins()}
          resource="plugins"
        />
      </SettingsGroup>
    </div>
  );
}
