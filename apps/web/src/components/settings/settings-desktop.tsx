import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { toasty } from '@/components/ui/sonner';
import { StatusDot } from '@/components/ui/status-dot';
import { rpc } from '@/services/rpc/rpc.client';
import IconCopy from '~icons/lucide/copy';
import IconMonitor from '~icons/lucide/monitor';
import IconShare from '~icons/lucide/share-2';

export function SettingsDesktop() {
  const desktop = window.__electrobunSendToHost;
  const server = useQuery({ ...rpc.server.info.queryOptions(), enabled: Boolean(desktop) });
  let status = m.desktop_connection_checking();
  let variant: 'default' | 'success' | 'destructive' = 'default';

  if (server.isSuccess || server.isError) {
    status = server.isSuccess ? m.desktop_connection_connected() : m.desktop_connection_offline();
    variant = server.isSuccess ? 'success' : 'destructive';
  }

  if (!desktop) {
    return null;
  }

  const addresses = window.__openbotsAddresses ?? [];

  return (
    <SettingsPanel
      description={m.settings_desktop_hint()}
      icon={IconMonitor}
      id="desktop"
      title={m.settings_desktop()}
    >
      <PanelRow>
        <span className="flex size-4 shrink-0 items-center justify-center"><StatusDot label={status} variant={variant} /></span>
        <PanelContent>
          <span className="text-sm font-medium">{status}</span>
          <PanelDescription className="truncate">{window.location.host}</PanelDescription>
        </PanelContent>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => desktop({ connection: true })}
        >
          {m.desktop_change()}
        </Button>
      </PanelRow>
      {addresses.length > 0 ? (
        <PanelRow className="items-start">
          <IconShare />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <PanelTitle asChild><h3>{m.desktop_connection_share()}</h3></PanelTitle>
            {addresses.map((address) => (
              <div className="flex items-center justify-between gap-4" key={address}>
                <span className="truncate font-mono text-xs">{address}</span>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => void navigator.clipboard.writeText(address).then(() => toasty(m.desktop_connection_copied(), '📋'))}
                >
                  <IconCopy />
                  {m.desktop_copy()}
                </Button>
              </div>
            ))}
          </div>
        </PanelRow>
      ) : null}
    </SettingsPanel>
  );
}
