import { m } from '@openbots/i18n/client';
import { ClientOnly, Link } from '@tanstack/react-router';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { SettingsAppearance } from '@/components/settings/settings-appearance';
import { SettingsChat } from '@/components/settings/settings-chat';
import { SettingsDesktop } from '@/components/settings/settings-desktop';
import { SettingsDevices } from '@/components/settings/settings-devices';
import { SettingsGeneral } from '@/components/settings/settings-general';
import { SettingsModels } from '@/components/settings/settings-models';
import { SettingsProviders } from '@/components/settings/settings-providers';
import { SettingsSources } from '@/components/settings/settings-sources';
import { SettingsTools } from '@/components/settings/settings-tools';
import { Button } from '@/components/ui/button';
import type { ConnectionInfo } from '@/types/connection.types';

interface SettingsPageProps {
  connection: ConnectionInfo
}

export function SettingsPage({ connection }: SettingsPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          <SettingsGeneral />
          <SettingsAppearance />
          <SettingsChat />
          <SettingsProviders />
          <SettingsModels />
          <SettingsTools />
          <SettingsSources />
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
          </nav>
        </div>
      </div>
    </div>
  );
}
