import { useSettingsSecrets } from '@repo/client/react';
import { secretMode } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import IconTrash from '~icons/lucide/trash-2';
import { Button } from '../button';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '../panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { SettingsGroup } from './settings-group';
import type { SecretMode } from '@repo/contracts/universal';

const SETTINGS_SECRETS_MODE = {
  proxy: m.settings_secrets_mode_proxy,
  varlock: m.settings_secrets_mode_varlock,
  env: m.settings_secrets_mode_env,
} satisfies Record<SecretMode, () => string>;

export function SettingsSecrets() {
  const secrets = useSettingsSecrets();

  return (
    <SettingsGroup title={m.settings_secrets()}>
      <PanelRow>
        <PanelContent>
          <PanelTitle>{m.settings_secrets_mode()}</PanelTitle>
          <PanelDescription>
            {m.settings_secrets_mode_hint()}
            {secrets.varlockInstallUrl ? (
              <>
                {' '}
                <a
                  className="underline"
                  href={secrets.varlockInstallUrl}
                  rel="noreferrer"
                  target="_blank"
                >{m.settings_secrets_varlock_install()}</a>
              </>
            ) : null}
          </PanelDescription>
        </PanelContent>
        <Select
          disabled={secrets.isPending || !secrets.mode}
          value={secrets.mode ?? ''}
          onValueChange={(value) => secrets.configure(secretMode.parse(value))}
        >
          <SelectTrigger aria-label={m.settings_secrets_mode()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {secretMode.options.map((mode) => (
              <SelectItem key={mode} value={mode}>{SETTINGS_SECRETS_MODE[mode]()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelRow>
      {secrets.secrets.length === 0 ? (
        <PanelRow>
          <PanelContent>
            <PanelDescription>{m.settings_secrets_empty()}</PanelDescription>
          </PanelContent>
        </PanelRow>
      ) : secrets.secrets.map((secret) => (
        <PanelRow key={secret.name}>
          <PanelContent>
            <PanelTitle>{secret.name}</PanelTitle>
            <PanelDescription>{secret.hosts.join(', ')}</PanelDescription>
          </PanelContent>
          <Button
            aria-label={m.settings_secrets_remove({ name: secret.name })}
            disabled={secrets.isPending}
            size="icon-sm"
            title={m.settings_secrets_remove({ name: secret.name })}
            variant="ghost"
            onClick={() => secrets.remove(secret.name)}
          >
            <IconTrash />
          </Button>
        </PanelRow>
      ))}
    </SettingsGroup>
  );
}
