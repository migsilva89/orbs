import { useSettingsProviders } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import IconKeyRound from '~icons/lucide/key-round';
import IconLogOut from '~icons/lucide/log-out';
import { Button } from '../button';
import { Combobox } from '../combobox';
import { FormErrors } from '../forms/form';
import { PanelDescription, PanelRow } from '../panel';
import { SettingsPanel } from './settings-panel';
import { SettingsProviderLogo } from './settings-provider-logo';
import { SettingsProviderRow } from './settings-provider-row';
import { SettingsProviderSession } from './settings-provider-session';

export function SettingsProviders() {
  const [selectedId, setSelectedId] = useState('');
  const { session, status, connected, available, isBusy, problem, login, dismiss } = useSettingsProviders();
  const selected = available.find((provider) => provider.id === selectedId);
  const visible = selected ? [...connected, selected] : connected;

  return (
    <SettingsPanel
      icon={IconKeyRound}
      id="providers"
      title={m.settings_providers()}
    >
      {session ? (
        <PanelRow className="flex-col items-stretch">
          <SettingsProviderSession
            key={session.id}
            session={session}
            onClose={() => dismiss(session.id)}
          />
        </PanelRow>
      ) : null}
      {connected.length === 0 ? (
        <PanelRow><PanelDescription>{m.settings_providers_empty()}</PanelDescription></PanelRow>
      ) : null}
      {available.length > 0 ? (
        <PanelRow>
          <Combobox
            aria-label={m.settings_providers_add()}
            disabled={isBusy}
            groups={[{ options: available.map((provider) => ({
              value: provider.id,
              label: provider.name,
              icon: <SettingsProviderLogo providerId={provider.id} />,
            })) }]}
            placeholder={m.settings_providers_add()}
            search={{ placeholder: m.settings_providers_search(), empty: m.settings_providers_search_empty() }}
            value={selected?.id ?? ''}
            onValueChange={setSelectedId}
          />
        </PanelRow>
      ) : null}
      {visible.map((provider) => (
        <SettingsProviderRow
          isBusy={isBusy}
          key={provider.id}
          provider={provider}
          status={status(provider)}
          onLogin={login}
        >
          {provider.isConfigured && provider.source === 'stored' ? (
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link
                params={{ providerId: provider.id }}
                resetScroll={false}
                to="/settings/providers/$providerId/logout"
              >
                <IconLogOut />
                {m.settings_providers_sign_out()}
              </Link>
            </Button>
          ) : null}
        </SettingsProviderRow>
      ))}
      <FormErrors error={problem} />
    </SettingsPanel>
  );
}
