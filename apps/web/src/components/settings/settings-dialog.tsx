import { botModelUsage } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { SectionDialog, SectionDialogBody, SectionDialogNav, SectionDialogNavItem, SectionDialogNavTitle } from '@repo/ui/section-dialog';
import { SettingsAppearance } from '@repo/ui/settings/settings-appearance';
import { SettingsDevices } from '@repo/ui/settings/settings-devices';
import { SettingsProviders } from '@repo/ui/settings/settings-providers';
import { SettingsSecrets } from '@repo/ui/settings/settings-secrets';
import { SettingsServer } from '@repo/ui/settings/settings-server';
import { SettingsSources } from '@repo/ui/settings/settings-sources';
import { SettingsThemeCreate } from '@repo/ui/settings/settings-theme-create';
import { Skeleton } from '@repo/ui/skeleton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ClientOnly, Link, useHydrated, useNavigate } from '@tanstack/react-router';
import { Suspense, useEffect } from 'react';
import { match } from 'ts-pattern';
import { SettingsChat } from '@/components/settings/settings-chat';
import { SettingsDesktop } from '@/components/settings/settings-desktop';
import { SettingsGeneral } from '@/components/settings/settings-general';
import { SettingsModelSwap } from '@/components/settings/settings-model-swap';
import { SettingsModels } from '@/components/settings/settings-models';
import { SettingsTools } from '@/components/settings/settings-tools';
import { useMutationPending } from '@/hooks/use-mutation-pending';
import { rpc } from '@/services/rpc/rpc.client';
import { SETTINGS_NAV } from '@/services/settings/settings.constants';
import type { ConnectionInfo } from '@repo/client/client';
import type { SettingsSection } from '@repo/contracts/universal';

interface SettingsDialogProps {
  connection: ConnectionInfo
  section: SettingsSection
  view: 'theme' | 'swap' | undefined
  modelKey: string | undefined
  deviceId: string | undefined
  providerId: string | undefined
  onClose: () => void
}

export function SettingsDialog({ connection, section, view, modelKey, deviceId, providerId, onClose }: SettingsDialogProps) {
  const navigate = useNavigate();

  const current = SETTINGS_NAV.find((item) => item.id === section) ?? SETTINGS_NAV[0];

  const isBusy = useMutationPending([
    rpc.devices.revoke.mutationKey(),
    rpc.providers.logout.mutationKey(),
    rpc.bots.swapModels.mutationKey(),
  ]);

  return (
    <SectionDialog
      description={m.settings_description()}
      isBusy={isBusy}
      title={m.settings_title()}
      onClose={onClose}
    >
      <SettingsDialogNav section={section} />
      <SectionDialogBody
        description={view ? undefined : current.description()}
        key={`${section}-${view ?? ''}`}
        title={view ? undefined : current.label()}
      >
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SettingsDialogSection
            connection={connection}
            deviceId={deviceId}
            modelKey={modelKey}
            providerId={providerId}
            section={section}
            view={view}
            onBack={() => void navigate({
              to: '/settings/$tab',
              params: { tab: section },
              replace: true,
            })}
          />
        </Suspense>
      </SectionDialogBody>
    </SectionDialog>
  );
}

interface SettingsDialogNavProps {
  section: SettingsSection
}

function SettingsDialogNav({ section }: SettingsDialogNavProps) {
  const hydrated = useHydrated();
  const items = SETTINGS_NAV.filter((item) => item.id !== 'desktop' || (hydrated && Boolean(window.__electrobunSendToHost)));

  return (
    <SectionDialogNav
      activeKey={section}
      footer={(
        <>
          <Button
            asChild
            size="xs"
            variant="link-muted"
          >
            <Link to="/lab/avatars">{m.layout_avatar_lab()}</Link>
          </Button>
          <Button
            asChild
            size="xs"
            variant="link-muted"
          >
            <Link to="/lab/chat">{m.layout_lab_chat()}</Link>
          </Button>
        </>
      )}
      header={<SectionDialogNavTitle>{m.settings_title()}</SectionDialogNavTitle>}
      label={m.settings_sections()}
    >
      {items.map((item) => (
        <SectionDialogNavItem isActive={item.id === section} key={item.id}>
          <Link
            replace
            params={{ tab: item.id }}
            resetScroll={false}
            to="/settings/$tab"
          >
            <item.icon />
            {item.label()}
          </Link>
        </SectionDialogNavItem>
      ))}
    </SectionDialogNav>
  );
}

interface SettingsDialogSwapProps {
  modelKey: string | undefined
  onBack: () => void
}

function SettingsDialogSwap({ modelKey, onBack }: SettingsDialogSwapProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const usage = botModelUsage({ bots }).get(modelKey ?? '');

  useEffect(() => {
    if (!usage) {
      onBack();
    }
  }, [usage, onBack]);

  return usage ? <SettingsModelSwap usage={usage} onClose={onBack} /> : null;
}

interface SettingsDialogSectionProps {
  connection: ConnectionInfo
  section: SettingsSection
  view: 'theme' | 'swap' | undefined
  modelKey: string | undefined
  deviceId: string | undefined
  providerId: string | undefined
  onBack: () => void
}

function SettingsDialogSection({ connection, section, view, modelKey, deviceId, providerId, onBack }: SettingsDialogSectionProps) {
  return match(section)
    .with('general', () => (view === 'theme' ? <ClientOnly><SettingsThemeCreate onBack={onBack} /></ClientOnly> : (
      <>
        <SettingsGeneral />
        <SettingsAppearance />
      </>
    )))
    .with('chat', () => <SettingsChat />)
    .with('models', () => (view === 'swap' ? <SettingsDialogSwap modelKey={modelKey} onBack={onBack} /> : (
      <>
        <SettingsProviders signOutId={providerId} onSignOutClose={onBack} />
        <SettingsModels />
      </>
    )))
    .with('tools', () => <SettingsTools />)
    .with('secrets', () => <SettingsSecrets />)
    .with('sources', () => <SettingsSources />)
    .with('server', () => <SettingsServer />)
    .with('devices', () => (
      <SettingsDevices
        connection={connection}
        revokeId={deviceId}
        onRevokeClose={onBack}
      />
    ))
    .with('desktop', () => <ClientOnly><SettingsDesktop /></ClientOnly>)
    .exhaustive();
}
