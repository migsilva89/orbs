import { useSettingsProviders } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Combobox } from '@repo/ui/combobox';
import { FormErrors } from '@repo/ui/forms/form';
import { OnboardingStepLayout } from '@repo/ui/onboarding/onboarding-step-layout';
import { PanelRow } from '@repo/ui/panel';
import { SettingsProviderLogo } from '@repo/ui/settings/settings-provider-logo';
import { SettingsProviderRow } from '@repo/ui/settings/settings-provider-row';
import { SettingsProviderSession } from '@repo/ui/settings/settings-provider-session';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { OnboardingSceneModel } from '@/components/onboarding/onboarding-scene-model';

export function OnboardingStepModel() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('');
  const { session, status, connected, available, featured, isBusy, problem, login, dismiss } = useSettingsProviders();
  const others = available.filter((provider) => !featured.includes(provider));
  const selected = others.find((provider) => provider.id === selectedId);
  const visible = [...connected, ...featured.filter((provider) => !provider.isConfigured), ...(selected ? [selected] : [])];
  const isReady = connected.length > 0;

  return (
    <OnboardingStepLayout
      actions={(
        <>
          {isReady ? null : <span className="text-xs text-muted-foreground">{m.onboarding_model_required()}</span>}
          <Button disabled={!isReady} onClick={() => void navigate({ to: '/onboarding/$step', params: { step: 'approvals' } })}>
            {m.onboarding_next()}
          </Button>
        </>
      )}
      back="welcome"
      description={m.onboarding_model_description()}
      scene={<OnboardingSceneModel connected={connected} featured={featured} />}
      title={m.onboarding_model_title()}
    >
      <div className="flex flex-col gap-3">
        {session ? (
          <SettingsProviderSession
            key={session.id}
            session={session}
            onClose={() => dismiss(session.id)}
          />
        ) : null}
        <div className="-mx-4 flex flex-col">
          {visible.map((provider) => (
            <SettingsProviderRow
              isBusy={isBusy}
              key={provider.id}
              provider={provider}
              status={status(provider)}
              onLogin={login}
            />
          ))}
          {others.length > 0 ? (
            <PanelRow>
              <Combobox
                aria-label={m.onboarding_model_more()}
                disabled={isBusy}
                groups={[{ options: others.map((provider) => ({
                  value: provider.id,
                  label: provider.name,
                  icon: <SettingsProviderLogo providerId={provider.id} />,
                })) }]}
                placeholder={m.onboarding_model_more()}
                search={{ placeholder: m.settings_providers_search(), empty: m.settings_providers_search_empty() }}
                value={selected?.id ?? ''}
                onValueChange={setSelectedId}
              />
            </PanelRow>
          ) : null}
        </div>
        <FormErrors error={problem} />
      </div>
    </OnboardingStepLayout>
  );
}
