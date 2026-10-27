import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { SettingsAppearance } from '@repo/ui/settings/settings-appearance';
import { SettingsDevices } from '@repo/ui/settings/settings-devices';
import { SettingsProviders } from '@repo/ui/settings/settings-providers';
import { SettingsSecrets } from '@repo/ui/settings/settings-secrets';
import { SettingsServer } from '@repo/ui/settings/settings-server';
import { SettingsSources } from '@repo/ui/settings/settings-sources';
import { ClientOnly, Link } from '@tanstack/react-router';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { SettingsChat } from '@/components/settings/settings-chat';
import { SettingsDesktop } from '@/components/settings/settings-desktop';
import { SettingsGeneral } from '@/components/settings/settings-general';
import { SettingsModels } from '@/components/settings/settings-models';
import { SettingsTools } from '@/components/settings/settings-tools';
import type { ConnectionInfo } from '@repo/client/client';

interface SettingsPageProps {
  connection: ConnectionInfo
}

export function SettingsPage({ connection }: SettingsPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader />
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          <SettingsGeneral />
          <SettingsAppearance />
          <SettingsChat />
          <SettingsProviders />
          <SettingsModels />
          <SettingsTools />
          <SettingsSecrets />
          <SettingsSources />
          <SettingsServer />
          <SettingsDevices connection={connection} />
          <ClientOnly>
            <SettingsDesktop />
          </ClientOnly>
          <nav aria-label={m.settings_more()} className="flex justify-center gap-4">
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
          </nav>
        </div>
      </div>
    </div>
  );
}
