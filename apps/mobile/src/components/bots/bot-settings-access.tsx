import { BOT_PERMISSION_HINTS, BOT_PERMISSION_LABELS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { Blocks, FileText, Plug, Shield, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useController, useFormContext } from 'react-hook-form';
import { Switch } from 'react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { botMenuPermissions } from '@/services/bot/bot-menu.utils';
import type { BotInherit } from '@openbots/client/client';
import type { BotForm } from '@openbots/contracts/universal';
import type { LucideIcon } from 'lucide-react-native';

const BOT_SETTINGS_INHERIT = [
  { resource: 'skills', icon: Sparkles, label: m.rooms_bot_global_skills, hint: m.rooms_bot_global_skills_hint },
  { resource: 'agentsFile', icon: FileText, label: m.rooms_bot_global_agents_md, hint: m.rooms_bot_global_agents_md_hint },
  { resource: 'mcp', icon: Plug, label: m.rooms_bot_global_mcp, hint: m.rooms_bot_global_mcp_hint },
  { resource: 'plugins', icon: Blocks, label: m.rooms_bot_global_plugins, hint: m.rooms_bot_global_plugins_hint },
] satisfies { resource: BotInherit; icon: LucideIcon; label: () => string; hint: () => string }[];

interface BotSettingsAccessProps {
  isDisabled: boolean;
}

export function BotSettingsAccess({ isDisabled }: BotSettingsAccessProps) {
  const form = useFormContext<BotForm>();
  const permission = useController({ control: form.control, name: 'permission' });
  const inherit = useController({ control: form.control, name: 'inherit' });

  return (
    <BotDetailsSection
      description={m.bots_access_hint()}
      icon={ShieldCheck}
      title={m.bots_access()}
    >
      <ItemGroup>
        <BotSettingsMenuRow
          description={BOT_PERMISSION_HINTS[permission.field.value]()}
          icon={Shield}
          isDisabled={isDisabled}
          items={botMenuPermissions({ permission: permission.field.value, onSelect: permission.field.onChange })}
          title={m.rooms_bot_permission()}
          value={BOT_PERMISSION_LABELS[permission.field.value]()}
        />
        {BOT_SETTINGS_INHERIT.map(({ resource, icon, label, hint }) => (
          <Item key={resource}>
            <ItemMedia className="mt-1 self-start">
              <Icon icon={icon} tone="muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{label()}</ItemTitle>
              <ItemDescription numberOfLines={0}>{hint()}</ItemDescription>
            </ItemContent>
            <Switch
              accessibilityLabel={label()}
              disabled={isDisabled}
              value={inherit.field.value.includes(resource)}
              onValueChange={(isOn) => inherit.field.onChange(isOn
                ? [...inherit.field.value, resource]
                : inherit.field.value.filter((item) => item !== resource))}
            />
          </Item>
        ))}
      </ItemGroup>
    </BotDetailsSection>
  );
}
