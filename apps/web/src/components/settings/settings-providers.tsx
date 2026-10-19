import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsProviderSession } from '@/components/settings/settings-provider-session';
import { Button } from '@/components/ui/button';
import { FormErrors } from '@/components/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { StatusDot } from '@/components/ui/status-dot';
import { rpc } from '@/services/rpc/rpc.client';
import IconKeyRound from '~icons/lucide/key-round';
import type { ProviderAuthType, ProviderSession } from '@openbots/contracts/universal';

export function SettingsProviders() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(rpc.providers.list.queryOptions());
  const refresh = () => queryClient.invalidateQueries({ queryKey: rpc.providers.list.key() });
  const [started, setStarted] = useState<ProviderSession | null>(null);

  const login = useMutation(rpc.providers.login.mutationOptions({
    onSuccess: (session) => {
      setStarted(session);
      return refresh();
    },
  }));

  const logout = useMutation(rpc.providers.logout.mutationOptions({ onSuccess: refresh }));
  const session = started ?? data.session;
  const isBusy = login.isPending || data.session?.status === 'pending' || started?.status === 'pending';

  const statusLabel = (isConfigured: boolean) => (isConfigured ? m.settings_providers_connected() : m.settings_providers_disconnected());

  const loginLabels = {
    oauth: m.settings_providers_sign_in(),
    api_key: m.settings_providers_api_key(),
  } satisfies Record<ProviderAuthType, string>;

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
            onClose={() => setStarted(null)}
          />
        </PanelRow>
      ) : null}
      {data.providers.map((provider) => (
        <PanelRow key={provider.id}>
          <span className="flex size-4 shrink-0 items-center justify-center">
            <StatusDot label={statusLabel(provider.isConfigured)} variant={provider.isConfigured ? 'success' : 'default'} />
          </span>
          <PanelContent>
            <PanelTitle className="truncate">{provider.name}</PanelTitle>
            <PanelDescription>{provider.label ?? statusLabel(provider.isConfigured)}</PanelDescription>
          </PanelContent>
          {provider.isConfigured && provider.source === 'stored' ? (
            <Button
              disabled={logout.isPending}
              size="sm"
              variant="outline"
              onClick={() => logout.mutate({ providerId: provider.id })}
            >
              {m.settings_providers_sign_out()}
            </Button>
          ) : provider.authTypes.map((authType) => (
            <Button
              disabled={isBusy}
              key={authType}
              size="sm"
              variant="outline"
              onClick={() => login.mutate({ providerId: provider.id, authType })}
            >
              {loginLabels[authType]}
            </Button>
          ))}
        </PanelRow>
      ))}
      <FormErrors error={login.isError || logout.isError ? m.settings_providers_error() : null} />
    </SettingsPanel>
  );
}
