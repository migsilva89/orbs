import { m } from '@openbots/i18n/client';
import { useFormContext } from 'react-hook-form';
import { BotPermissionSelect } from '@/components/bots/bot-permission-select';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import IconBlocks from '~icons/lucide/blocks';
import IconFileText from '~icons/lucide/file-text';
import IconPlug from '~icons/lucide/plug';
import IconShield from '~icons/lucide/shield';
import IconSparkles from '~icons/lucide/sparkles';
import type { BotInherit } from '@openbots/client/client';
import type { BotForm } from '@openbots/contracts/universal';

const BOT_FORM_INHERIT = [
  { resource: 'skills', icon: IconSparkles, label: m.rooms_bot_global_skills, hint: m.rooms_bot_global_skills_hint },
  { resource: 'agentsFile', icon: IconFileText, label: m.rooms_bot_global_agents_md, hint: m.rooms_bot_global_agents_md_hint },
  { resource: 'mcp', icon: IconPlug, label: m.rooms_bot_global_mcp, hint: m.rooms_bot_global_mcp_hint },
  { resource: 'plugins', icon: IconBlocks, label: m.rooms_bot_global_plugins, hint: m.rooms_bot_global_plugins_hint },
] satisfies { resource: BotInherit; icon: typeof IconSparkles; label: () => string; hint: () => string }[];

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
            {BOT_FORM_INHERIT.map(({ resource, icon: Icon, label, hint }) => (
              <FormItem key={resource}>
                <PanelRow>
                  <Icon />
                  <PanelContent>
                    <FormLabel>{label()}</FormLabel>
                    <PanelDescription>{hint()}</PanelDescription>
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
