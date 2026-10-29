import { useSettingsProviderLogout, useSettingsProviders } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useNavigate } from '@tanstack/react-router';
import { Fragment, useState } from 'react';
import { Combobox } from '../combobox';
import { FormErrors } from '../forms/form';
import { PanelDescription, PanelRow } from '../panel';
import { SettingsConfirm } from './settings-confirm';
import { SettingsGroup } from './settings-group';
import { SettingsProviderLogo } from './settings-provider-logo';
import { SettingsProviderRow } from './settings-provider-row';
import { SettingsProviderSession } from './settings-provider-session';

interface SettingsProvidersProps {
  signOutId: string | undefined
  onSignOutClose: () => void
}

export function SettingsProviders({ signOutId, onSignOutClose }: SettingsProvidersProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('');
  const { session, status, connected, available, isBusy, problem, login, dismiss } = useSettingsProviders();
  const selected = available.find((provider) => provider.id === selectedId);
  const visible = selected ? [...connected, selected] : connected;
  const logout = useSettingsProviderLogout({ onDone: onSignOutClose });

  return (
    <SettingsGroup isTitleVisible title={m.settings_providers()}>
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
        <Fragment key={provider.id}>
          <SettingsProviderRow
            isBusy={isBusy}
            provider={provider}
            status={status(provider)}
            onLogin={login}
            onSignOut={provider.isConfigured && provider.source === 'stored' ? () => {
              logout.reset();
              void navigate({
                to: '/settings/providers/$providerId/logout',
                params: { providerId: provider.id },
                replace: true,
                resetScroll: false,
              });
            } : undefined}
          />
          {signOutId === provider.id ? (
            <SettingsConfirm
              confirmLabel={m.settings_providers_sign_out()}
              description={m.settings_providers_sign_out_description({ provider: provider.name })}
              error={logout.problem}
              pending={logout.isPending}
              title={m.settings_providers_sign_out_title({ provider: provider.name })}
              onCancel={onSignOutClose}
              onConfirm={() => logout.logout(provider.id)}
            />
          ) : null}
        </Fragment>
      ))}
      <FormErrors error={problem} />
    </SettingsGroup>
  );
}
