import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import * as DropdownMenu from '@/components/ui/dropdown-menu';
import * as Sidebar from '@/components/ui/sidebar';
import { StatusDot } from '@/components/ui/status-dot';
import { connectionForget } from '@/services/connection/connection.client';
import { LAYOUT_MENU } from '@/services/layout/layout.constants';
import { rpc } from '@/services/rpc/rpc.client';
import BrandsLogo from '~icons/brands/logo';
import LucideChevronsUpDown from '~icons/lucide/chevrons-up-down';
import IconLogOut from '~icons/lucide/log-out';
import type { ConnectionInfo } from '@/types/connection.types';

interface LayoutNavDeviceProps {
  connection: ConnectionInfo
}

export function LayoutNavDevice({ connection }: LayoutNavDeviceProps) {
  const { isMobile } = Sidebar.useSidebar();
  const server = useQuery(rpc.server.info.queryOptions());
  const host = new URL((connection.addresses.find((address) => address.kind !== 'loopback') ?? connection.addresses[0]).url).host;

  const status = match(server)
    .with({ isError: true }, () => 'destructive' as const)
    .with({ isSuccess: true }, () => 'success' as const)
    .otherwise(() => 'default' as const);

  async function disconnect() {
    await rpc.devices.revoke.call({ id: connection.deviceId }).catch(() => undefined);
    await connectionForget();
    location.assign('/connect');
  }

  return (
    <Sidebar.SidebarMenu>
      <Sidebar.SidebarMenuItem>
        <DropdownMenu.DropdownMenu>
          <DropdownMenu.DropdownMenuTrigger asChild>
            <Sidebar.SidebarMenuButton size="lg">
              <span className="relative flex size-8 shrink-0 items-center justify-center">
                <BrandsLogo aria-hidden="true" className="size-5" />
                <span className="absolute -right-0.5 -bottom-0.5 flex rounded-full bg-sidebar p-0.5">
                  <StatusDot label={server.isError ? m.layout_unreachable() : m.layout_connected()} variant={status} />
                </span>
              </span>
              <div className="grid flex-1 text-left text-sm/tight group-data-[collapsible=icon]:sr-only">
                <span className="truncate font-semibold">{env.VITE_APP_NAME}</span>
                <span className="truncate text-xxs text-muted-foreground">{host}</span>
              </div>
              <LucideChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </Sidebar.SidebarMenuButton>
          </DropdownMenu.DropdownMenuTrigger>
          <DropdownMenu.DropdownMenuContent
            align="end"
            className="w-[--radix-dropdown-menu-trigger-width] max-w-56 min-w-32"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenu.DropdownMenuGroup>
              {LAYOUT_MENU.map((item) => (
                <DropdownMenu.DropdownMenuItem asChild key={item.link}>
                  <Link to={item.link}>
                    <item.icon className="size-4" />
                    <span className="flex-1">{item.label()}</span>
                  </Link>
                </DropdownMenu.DropdownMenuItem>
              ))}
            </DropdownMenu.DropdownMenuGroup>
            <DropdownMenu.DropdownMenuSeparator />
            <DropdownMenu.DropdownMenuItem onSelect={() => void disconnect()}>
              <IconLogOut className="size-4" />
              <span className="flex-1">{m.layout_disconnect()}</span>
            </DropdownMenu.DropdownMenuItem>
          </DropdownMenu.DropdownMenuContent>
        </DropdownMenu.DropdownMenu>
      </Sidebar.SidebarMenuItem>
    </Sidebar.SidebarMenu>
  );
}
