import { Link } from '@tanstack/react-router';
import { RoomsSidebar, RoomsSidebarActions } from '@/components/rooms/rooms-sidebar';
import * as Sidebar from '@/components/ui/sidebar';
import BrandsOpenbots from '~icons/brands/openbots';
import { LayoutBrand } from './layout-brand';
import { LayoutNavDevice } from './layout-nav-device';
import type { ComponentProps } from 'react';

export function LayoutAppSidebar({ ...props }: ComponentProps<typeof Sidebar.Sidebar>) {
  return (
    <Sidebar.Sidebar {...props}>
      <div className="cursor-default electrobun-webkit-app-region-drag">
        <Sidebar.SidebarHeader className="flex-row items-center desktop:h-13">
          <Link className="flex items-center gap-2 overflow-hidden px-2 outline-none group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 md:hidden" to="/rooms">
            <BrandsOpenbots aria-hidden="true" className="size-5 shrink-0 text-black dark:text-white" />
            <LayoutBrand className="group-data-[collapsible=icon]:sr-only" />
          </Link>
          <RoomsSidebarActions />
        </Sidebar.SidebarHeader>
      </div>
      <Sidebar.SidebarContent>
        <RoomsSidebar />
      </Sidebar.SidebarContent>
      <Sidebar.SidebarFooter className="desktop:group-data-[collapsible=icon]:mb-3"><LayoutNavDevice /></Sidebar.SidebarFooter>
      <Sidebar.SidebarRail />
    </Sidebar.Sidebar>
  );
}
