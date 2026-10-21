import { ROOMS_SEND_MODES } from '@openbots/client/client';
import { useChatDefaults, useChatHideVerbose } from '@openbots/client/react';
import { conversationWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { EyeOff, ListOrdered, Monitor, Palette, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Switch } from 'react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { useAppearance } from '@/hooks/use-appearance';
import { useToast } from '@/hooks/use-toast';
import { appearanceRead, appearanceSave } from '@/services/appearance/appearance.client';
import { APPEARANCE_CHOICES } from '@/services/appearance/appearance.constants';
import type { AppearanceChoice } from '@/types/appearance.types';

const SETTINGS_APPEARANCE_LABELS = {
  system: m.settings_appearance_system,
  light: m.settings_appearance_light,
  dark: m.settings_appearance_dark,
} satisfies Record<AppearanceChoice, () => string>;

export function SettingsGeneral() {
  const defaults = useChatDefaults();
  const verbose = useChatHideVerbose();
  const router = useRouter();
  const toast = useToast();
  const palettes = useAppearance();
  const [appearance, setAppearance] = useState(appearanceRead);
  const whenBusy = defaults.settings?.whenBusy;

  return (
    <BotDetailsSection icon={Settings} title={m.settings_general()}>
      <ItemGroup>
        <Item>
          <ItemMedia className="mt-1 self-start">
            <Icon icon={EyeOff} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{m.settings_general_verbose()}</ItemTitle>
          </ItemContent>
          <Switch
            accessibilityLabel={m.settings_general_verbose()}
            disabled={verbose.isPending}
            value={verbose.hideVerbose}
            onValueChange={verbose.setHideVerbose}
          />
        </Item>
        <BotSettingsMenuRow
          icon={ListOrdered}
          isDisabled={!whenBusy || defaults.isPending}
          items={conversationWhenBusy.options.map((mode) => ({
            label: ROOMS_SEND_MODES[mode](),
            systemImage: mode === whenBusy ? 'checkmark' : undefined,
            onSelect: () => defaults.configure({ whenBusy: mode }),
          }))}
          title={m.rooms_send_mode()}
          value={whenBusy ? ROOMS_SEND_MODES[whenBusy]() : '…'}
        />
        <BotSettingsMenuRow
          icon={Monitor}
          items={APPEARANCE_CHOICES.map((choice) => ({
            label: SETTINGS_APPEARANCE_LABELS[choice](),
            systemImage: choice === appearance ? 'checkmark' : undefined,
            onSelect: () => {
              appearanceSave(choice);
              setAppearance(choice);
            },
          }))}
          title={m.settings_appearance_mode()}
          value={SETTINGS_APPEARANCE_LABELS[appearance]()}
        />
        <BotSettingsMenuRow
          icon={Palette}
          items={[
            ...palettes.themes.map((palette) => ({
              label: palette.name,
              systemImage: palette.id === palettes.selected ? 'checkmark' as const : undefined,
              onSelect: () => palettes.select(palette.id) || toast.show({ message: m.mobile_theme_storage_error() }),
            })),
            {
              label: m.settings_theme_add(),
              systemImage: 'plus',
              hasDividerBefore: true,
              onSelect: () => router.push('/settings/themes/create'),
            },
          ]}
          title={m.settings_appearance_theme()}
          value={palettes.themes.find((palette) => palette.id === palettes.selected)?.name ?? ''}
        />
      </ItemGroup>
    </BotDetailsSection>
  );
}
