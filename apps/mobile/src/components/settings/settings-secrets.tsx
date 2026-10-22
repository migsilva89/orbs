import { useSettingsSecrets } from '@repo/client/react';
import { secretMode } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { ExternalLink, KeyRound, Lock, Route, Trash2 } from 'lucide-react-native';
import { Linking } from 'react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Item, ItemButton, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { SecretMode } from '@repo/contracts/universal';

const SETTINGS_SECRETS_MODE = {
  proxy: m.settings_secrets_mode_proxy,
  varlock: m.settings_secrets_mode_varlock,
  env: m.settings_secrets_mode_env,
} satisfies Record<SecretMode, () => string>;

export function SettingsSecrets() {
  const secrets = useSettingsSecrets();

  return (
    <BotDetailsSection
      icon={Lock}
      title={m.settings_secrets()}
    >
      <ItemGroup>
        <BotSettingsMenuRow
          icon={Route}
          isDisabled={!secrets.mode || secrets.isPending}
          items={secretMode.options.map((mode) => ({
            label: SETTINGS_SECRETS_MODE[mode](),
            systemImage: mode === secrets.mode ? 'checkmark' : undefined,
            onSelect: () => secrets.configure(mode),
          }))}
          title={m.settings_secrets_mode()}
          value={secrets.mode ? SETTINGS_SECRETS_MODE[secrets.mode]() : '…'}
        />
        {secrets.varlockInstallUrl ? (
          <ItemButton accessibilityRole="link" onPress={() => void Linking.openURL(secrets.varlockInstallUrl ?? '')}>
            <ItemMedia>
              <Icon icon={ExternalLink} tone="muted" />
            </ItemMedia>
            <ItemContent>
              <ItemDescription>{m.settings_secrets_varlock_install()}</ItemDescription>
            </ItemContent>
          </ItemButton>
        ) : null}
        {secrets.secrets.length === 0 ? (
          <Item>
            <ItemMedia>
              <Icon icon={KeyRound} tone="muted" />
            </ItemMedia>
            <ItemContent>
              <ItemDescription>{m.settings_secrets_empty()}</ItemDescription>
            </ItemContent>
          </Item>
        ) : secrets.secrets.map((secret) => (
          <Item key={secret.name}>
            <ItemMedia>
              <Icon icon={KeyRound} tone="muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{secret.name}</ItemTitle>
              <ItemDescription>{secret.hosts.join(', ')}</ItemDescription>
            </ItemContent>
            <Button
              accessibilityLabel={m.settings_secrets_remove({ name: secret.name })}
              disabled={secrets.isPending}
              size="icon-sm"
              variant="ghost"
              onPress={() => secrets.remove(secret.name)}
            >
              <Icon icon={Trash2} size="sm" />
            </Button>
          </Item>
        ))}
      </ItemGroup>
    </BotDetailsSection>
  );
}
