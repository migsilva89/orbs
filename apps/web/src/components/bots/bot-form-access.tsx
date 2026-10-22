import { m } from '@repo/i18n/client';
import { useFormContext } from 'react-hook-form';
import { BotPermissionSelect } from '@/components/bots/bot-permission-select';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { PanelContent, PanelRow } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import IconBlocks from '~icons/lucide/blocks';
import IconFileText from '~icons/lucide/file-text';
import IconPlug from '~icons/lucide/plug';
import IconShield from '~icons/lucide/shield';
import IconSparkles from '~icons/lucide/sparkles';
import type { BotInherit } from '@repo/client/client';
import type { BotForm } from '@repo/contracts/universal';

const BOT_FORM_INHERIT = [
  { resource: 'skills', icon: IconSparkles, label: m.rooms_bot_global_skills },
  { resource: 'agentsFile', icon: IconFileText, label: m.rooms_bot_global_agents_md },
  { resource: 'mcp', icon: IconPlug, label: m.rooms_bot_global_mcp },
  { resource: 'plugins', icon: IconBlocks, label: m.rooms_bot_global_plugins },
] satisfies { resource: BotInherit; icon: typeof IconSparkles; label: () => string }[];

interface BotFormAccessProps {
  busy: boolean
}

export function BotFormAccess({ busy }: BotFormAccessProps) {
  const form = useFormContext<BotForm>();

  return (
    <>
      <PanelRow className="items-start">
        <IconShield />
        <div className="min-w-0 flex-1">
          <FormField
            control={form.control}
            name="permission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.rooms_bot_permission()}</FormLabel>
                <BotPermissionSelect
                  disabled={busy}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </div>
      </PanelRow>
      <FormField
        control={form.control}
        name="inherit"
        render={({ field }) => (
          <>
            {BOT_FORM_INHERIT.map(({ resource, icon: Icon, label }) => (
              <FormItem key={resource}>
                <PanelRow>
                  <Icon />
                  <PanelContent>
                    <FormLabel>{label()}</FormLabel>
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
            ))}
          </>
        )}
      />
    </>
  );
}
