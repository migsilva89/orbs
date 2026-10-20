import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsProviderLogo } from '@/components/settings/settings-provider-logo';
import { SettingsProviderSession } from '@/components/settings/settings-provider-session';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormErrors } from '@/components/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { StatusDot } from '@/components/ui/status-dot';
import { rpc } from '@/services/rpc/rpc.client';
import IconKeyRound from '~icons/lucide/key-round';
import IconLogIn from '~icons/lucide/log-in';
import IconLogOut from '~icons/lucide/log-out';
import IconRefreshCw from '~icons/lucide/refresh-cw';
import type { ProviderSession } from '@openbots/contracts/universal';

export function SettingsProviders() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(rpc.providers.list.queryOptions());
  const refresh = () => queryClient.invalidateQueries({ queryKey: rpc.providers.list.key() });
  const [started, setStarted] = useState<ProviderSession | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);

  const login = useMutation(rpc.providers.login.mutationOptions({
    onSuccess: (session) => {
      setStarted(session);
      return refresh();
    },
  }));

  const latestSession = started ?? data.session;
  const session = latestSession?.id === dismissedSessionId ? null : latestSession;
  const isBusy = login.isPending || data.session?.status === 'pending';
  const providers = data.providers.filter((provider) => provider.id !== 'openai-codex');
  const available = providers.filter((provider) => !provider.isConfigured && provider.authTypes.length > 0);
  const selected = available.find((provider) => provider.id === selectedId);
  const connected = providers.filter((provider) => provider.isConfigured);
  const visible = selected ? [...connected, selected] : connected;

  const statusLabel = (isConfigured: boolean) => (isConfigured ? m.settings_providers_connected() : m.settings_providers_disconnected());

  return (
    <SettingsPanel
      description={m.settings_providers_hint()}
      icon={IconKeyRound}
      id="providers"
      title={m.settings_providers()}
    >
      {session ? (
        <PanelRow className="flex-col items-stretch">
          <SettingsProviderSession
            key={session.id}
            session={session}
            onClose={() => {
              setDismissedSessionId(session.id);
              setStarted(null);
            }}
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
        <PanelRow className="flex-wrap" key={provider.id}>
          <SettingsProviderLogo providerId={provider.id} />
          <PanelContent>
            <PanelTitle className="truncate">{provider.name}</PanelTitle>
            <div className="flex items-center gap-2">
              <StatusDot label={statusLabel(provider.isConfigured)} variant={provider.isConfigured ? 'success' : 'default'} />
              <PanelDescription>{provider.label ?? statusLabel(provider.isConfigured)}</PanelDescription>
            </div>
          </PanelContent>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {provider.authTypes.map((authType) => (
              <Button
                disabled={isBusy}
                key={authType}
                size="sm"
                variant="outline"
                onClick={() => login.mutate({ providerId: provider.id, authType })}
              >
                {match(authType)
                  .with('oauth', () => provider.isConfigured && provider.credentialType === 'oauth' ? <IconRefreshCw /> : <IconLogIn />)
                  .with('api_key', () => <IconKeyRound />)
                  .exhaustive()}
                {match(authType)
                  .with('oauth', () => provider.isConfigured && provider.credentialType === 'oauth' ? m.settings_providers_reconnect() : m.settings_providers_sign_in())
                  .with('api_key', () => provider.isConfigured ? m.settings_providers_update_api_key() : m.settings_providers_api_key())
                  .exhaustive()}
              </Button>
            ))}
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
          </div>
        </PanelRow>
      ))}
      <FormErrors error={login.isError ? m.settings_providers_error() : null} />
    </SettingsPanel>
  );
}
