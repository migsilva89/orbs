import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { m } from '@repo/i18n/client';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as Sidebar from '@/components/ui/sidebar';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconGripVertical from '~icons/lucide/grip-vertical';
import IconPencil from '~icons/lucide/pencil';
import IconTrash from '~icons/lucide/trash-2';
import type { RoomsSidebarSection } from '@repo/client/client';
import type { ReactNode } from 'react';

interface RoomsSidebarSectionGroupProps {
  section: RoomsSidebarSection
  children: ReactNode
  onCollapsedChange: (isCollapsed: boolean) => void
}

export function RoomsSidebarSectionGroup({ section, children, onCollapsedChange }: RoomsSidebarSectionGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `section:${section.id}` });

  const { setOpenMobile } = Sidebar.useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Collapsible open={!section.isCollapsed} onOpenChange={(open) => onCollapsedChange(!open)}>
      <Sidebar.SidebarGroup
        className="data-[dragging=true]:opacity-40"
        data-dragging={isDragging}
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition }}
      >
        <Sidebar.SidebarGroupLabel
          className="group/section-label relative"
          onContextMenu={(event) => {
            event.preventDefault();
            setIsMenuOpen(true);
          }}
        >
          <button
            aria-label={m.rooms_section_reorder({ name: section.name })}
            className="absolute top-1/2 -left-2 flex-center -translate-y-1/2 cursor-grab touch-none rounded-sm text-muted-foreground/70 ring-sidebar-ring outline-hidden transition-opacity group-hover/section-label:opacity-100 group-data-[collapsible=icon]:hidden focus-visible:opacity-100 focus-visible:ring-2 md:opacity-0"
            type="button"
            {...attributes}
            {...listeners}
          >
            <IconGripVertical className="size-3.5" />
          </button>
          <CollapsibleTrigger asChild>
            <button
              className="group/section-trigger flex min-w-0 flex-1 items-center gap-1 rounded-sm text-left ring-sidebar-ring outline-hidden focus-visible:ring-2"
              type="button"
            >
              <span className="truncate">{section.name}</span>
              <IconChevronRight className="size-3.5 shrink-0 transition-transform group-data-[state=open]/section-trigger:rotate-90" />
              <span className="ml-auto tabular-nums">{section.chats.length}</span>
            </button>
          </CollapsibleTrigger>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <span aria-hidden="true" className="absolute top-1/2 right-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  search={(previous) => ({ ...previous, section: section.id })}
                  to="."
                  onClick={() => setOpenMobile(false)}
                >
                  <IconPencil className="size-4" />
                  {m.rooms_section_rename()}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild variant="destructive">
                <Link
                  search={(previous) => ({ ...previous, sectionDelete: section.id })}
                  to="."
                  onClick={() => setOpenMobile(false)}
                >
                  <IconTrash className="size-4" />
                  {m.rooms_section_delete()}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Sidebar.SidebarGroupLabel>
        <CollapsibleContent>
          <Sidebar.SidebarMenu>{children}</Sidebar.SidebarMenu>
        </CollapsibleContent>
      </Sidebar.SidebarGroup>
    </Collapsible>
  );
}
