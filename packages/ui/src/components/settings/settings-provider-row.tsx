import { m } from '@repo/i18n/client';
import { match } from 'ts-pattern';
import IconKeyRound from '~icons/lucide/key-round';
import IconLogIn from '~icons/lucide/log-in';
import IconRefreshCw from '~icons/lucide/refresh-cw';
import { Button } from '../button';
import { PanelContent, PanelRow, PanelTitle } from '../panel';
import { StatusDot } from '../status-dot';
import { SettingsProviderLogo } from './settings-provider-logo';
import type { SettingsProviderStatus } from '@repo/client/react';
import type { Provider, ProviderAuthType } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface SettingsProviderRowProps {
  provider: Provider
  status: SettingsProviderStatus
  isBusy: boolean
  children?: ReactNode
  onLogin: (providerId: string, authType: ProviderAuthType) => void
}

export function SettingsProviderRow({ provider, status, isBusy, children, onLogin }: SettingsProviderRowProps) {
  return (
    <PanelRow className="flex-wrap">
      <SettingsProviderLogo providerId={provider.id} />
      <PanelContent className="min-w-24">
        <PanelTitle className="truncate">{provider.name}</PanelTitle>
        <div className="flex items-center gap-1.5">
          <StatusDot label={status.label} variant={status.tone} />
          <span className="text-xxs text-muted-foreground">{provider.label ?? status.label}</span>
        </div>
      </PanelContent>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {provider.authTypes.map((authType) => (
          <Button
            disabled={isBusy}
            key={authType}
            size="sm"
            variant="outline"
            onClick={() => onLogin(provider.id, authType)}
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
        {children}
      </div>
    </PanelRow>
  );
}
