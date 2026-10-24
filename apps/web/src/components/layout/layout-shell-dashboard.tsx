import { useLocation } from '@tanstack/react-router';
import * as Sidebar from '@/components/ui/sidebar';
import { LAYOUT_SIDEBAR_COOKIES } from '@/services/layout/layout.constants';
import { LayoutAppSidebar } from './layout-app-sidebar';
import type { ConnectionInfo } from '@/types/connection.types';
import type { LayoutSidebarsOpen } from '@/types/layout.types';
import type { ReactNode } from 'react';

interface LayoutShellDashboardProps {
  connection: ConnectionInfo
  children: ReactNode
  aside?: ReactNode
  asidePathname?: string
  sidebars: LayoutSidebarsOpen
}

export function LayoutShellDashboard({ children, aside, asidePathname, sidebars, connection }: LayoutShellDashboardProps) {
  const { pathname } = useLocation();

  return (
    <div className="fixed inset-x-0 top-(--app-top) flex h-(--app-height) overflow-hidden bg-sidebar pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Sidebar.SidebarProvider
        className="min-h-0 overflow-hidden desktop:[--sidebar-width-icon:5rem]!"
        cookieName={LAYOUT_SIDEBAR_COOKIES.rooms}
        defaultOpen={sidebars.rooms}
        pathname={pathname}
      >
        <LayoutAppSidebar collapsible="icon" connection={connection} />
        {aside ? (
          <>
            <Sidebar.SidebarTrigger className="absolute top-3 left-3 z-30 md:hidden desktop:top-16" />
            <div className="flex min-h-0 min-w-0 flex-1">
              <Sidebar.SidebarProvider
                className="min-h-0 min-w-0"
                cookieName={LAYOUT_SIDEBAR_COOKIES.details}
                defaultOpen={sidebars.details}
                defaultWidth={320}
                pathname={asidePathname ?? pathname}
                shortcut={null}
              >
                <Sidebar.SidebarInset className="min-h-0 min-w-0 overflow-hidden">
                  <LayoutShellDrag />
                  {children}
                </Sidebar.SidebarInset>
                {aside}
              </Sidebar.SidebarProvider>
            </div>
          </>
        ) : (
          <Sidebar.SidebarInset className="min-h-0 min-w-0 overflow-hidden">
            <LayoutShellDrag />
            {children}
          </Sidebar.SidebarInset>
        )}
      </Sidebar.SidebarProvider>
    </div>
  );
}

function LayoutShellDrag() {
  return <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 hidden h-13 cursor-default electrobun-webkit-app-region-drag select-none desktop:block" />;
}
