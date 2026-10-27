import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ROOMS_DRAG_PRESS, roomsSidebarOrder } from '@repo/client/client';
import { useChatArrange, useSidebarSections } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui/collapsible';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@repo/ui/empty';
import { RoomItem } from '@repo/ui/rooms/room-item';
import { RoomsDragCard } from '@repo/ui/rooms/rooms-drag-card';
import { RoomsPinZone } from '@repo/ui/rooms/rooms-pin-zone';
import { RoomsSidebarSectionGroup } from '@repo/ui/rooms/rooms-sidebar-section';
import * as Sidebar from '@repo/ui/sidebar';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { match } from 'ts-pattern';
import { rpc } from '@/services/rpc/rpc.client';
import IconPlus from '~icons/lucide/plus';
import IconSearch from '~icons/lucide/search';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';

export function RoomsSidebarActions() {
  const { setOpenMobile } = Sidebar.useSidebar();

  return (
    <div className="ml-auto flex items-center gap-1.5 electrobun-webkit-app-region-no-drag group-data-[collapsible=icon]:hidden">
      <Button
        asChild
        size="icon-sm"
        variant="outline"
      >
        <Link
          aria-label={m.rooms_search()}
          search={(previous) => ({ ...previous, find: true })}
          title={m.rooms_search()}
          to="."
          onClick={() => setOpenMobile(false)}
        >
          <IconSearch className="size-4" />
        </Link>
      </Button>
      <Button
        asChild
        size="icon-sm"
        variant="outline"
      >
        <Link
          aria-label={m.rooms_new()}
          search={{ start: true }}
          title={m.rooms_new()}
          to="/rooms"
          onClick={() => setOpenMobile(false)}
        >
          <IconPlus className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

interface RoomsSidebarEmptyProps {
  hasBots: boolean
}

function RoomsSidebarEmpty({ hasBots }: RoomsSidebarEmptyProps) {
  const { setOpenMobile } = Sidebar.useSidebar();

  return (
    <Empty className="group-data-[collapsible=icon]:hidden" size="sm">
      <EmptyHeader>
        <EmptyDescription>{hasBots ? m.rooms_sidebar_empty_rooms() : m.rooms_sidebar_empty_bots()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          asChild
          size="sm"
          variant="outline"
        >
          {hasBots ? (
            <Link
              search={{ start: true }}
              to="/rooms"
              onClick={() => setOpenMobile(false)}
            >
              <IconPlus className="size-4" />
              {m.rooms_new()}
            </Link>
          ) : (
            <Link to="/bots/create" onClick={() => setOpenMobile(false)}>
              <IconPlus className="size-4" />
              {m.rooms_bot_title()}
            </Link>
          )}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

interface RoomsSidebarUngroupedProps {
  id: string
  children: ReactNode
}

function RoomsSidebarUngrouped({ id, children }: RoomsSidebarUngroupedProps) {
  const { setNodeRef } = useDroppable({ id });

  return <div ref={setNodeRef}>{children}</div>;
}

export function RoomsSidebar() {
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const sidebarSections = useSidebarSections();
  const arrange = useChatArrange();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(TouchSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { pinned, sections, others, hidden } = roomsSidebarOrder({ chats, sections: sidebarSections.sections });
  const shown = [...pinned, ...sections.flatMap((section) => section.chats), ...others];
  const dragged = shown.find((chat) => chat.botId === draggedId);
  const pinZone = 'pin';
  const ungroupedZone = 'section:ungrouped';

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedId(null);
    const swallowClickThatEndsDrag = (event: Event) => event.stopPropagation();
    window.addEventListener('click', swallowClickThatEndsDrag, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallowClickThatEndsDrag, { capture: true }));

    if (!over || over.id === active.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('section:')) {
      const sectionIds = sections.map((section) => section.id);
      const activeSectionId = activeId.slice('section:'.length);
      const overSectionId = overId.slice('section:'.length);

      if (sectionIds.includes(activeSectionId) && sectionIds.includes(overSectionId)) {
        sidebarSections.arrange({ sectionIds: arrayMove(sectionIds, sectionIds.indexOf(activeSectionId), sectionIds.indexOf(overSectionId)) });
      }

      return;
    }

    const activeChat = shown.find((chat) => chat.botId === activeId);
    const overChat = shown.find((chat) => chat.botId === overId);

    if (!activeChat) {
      return;
    }

    const toPinned = overId === pinZone || overChat?.isPinned === true;

    const sectionId = match(overId)
      .with(ungroupedZone, () => null)
      .when((id) => id.startsWith('section:'), (id) => id.slice('section:'.length))
      .otherwise(() => (overChat ? overChat.sectionId : activeChat.sectionId));

    const group = match({ toPinned, sectionId })
      .with({ toPinned: true }, () => pinned)
      .with({ sectionId: null }, () => others)
      .otherwise(() => sections.find((section) => section.id === sectionId)?.chats ?? []);

    const ids = group.map((chat) => chat.botId);
    const from = ids.indexOf(activeId);
    const to = overChat ? ids.indexOf(overChat.botId) : -1;
    const rest = ids.filter((botId) => botId !== activeId);
    const insertAt = match(to).when((index) => index >= 0, (index) => index).otherwise(() => (overId === pinZone ? 0 : rest.length));

    const botIds = match({ isSameGroup: from >= 0 && to >= 0 })
      .with({ isSameGroup: true }, () => arrayMove(ids, from, to))
      .otherwise(() => [...rest.slice(0, insertAt), activeId, ...rest.slice(insertAt)]);

    arrange({
      botIds,
      isPinned: toPinned,
      sectionId: toPinned ? undefined : sectionId,
    });
  };

  const dragOverlayOnDocumentBody = dragged ? createPortal(
    <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
      <RoomsDragCard chat={dragged} />
    </DragOverlay>,
    document.body,
  ) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragCancel={() => setDraggedId(null)}
      onDragEnd={onDragEnd}
      onDragStart={({ active }) => setDraggedId(String(active.id))}
    >
      {pinned.length === 0 && dragged ? <RoomsPinZone id={pinZone} /> : null}
      {pinned.length > 0 || chats.length === 0 ? (
        <Sidebar.SidebarGroup className="-mt-2">
          {chats.length === 0 ? <RoomsSidebarEmpty hasBots={bots.length > 0} /> : null}
          <SortableContext items={pinned.map((chat) => chat.botId)} strategy={verticalListSortingStrategy}>
            <Sidebar.SidebarMenu>
              {pinned.map((chat) => <RoomItem chat={chat} key={chat.botId} />)}
            </Sidebar.SidebarMenu>
          </SortableContext>
        </Sidebar.SidebarGroup>
      ) : null}
      <SortableContext items={sections.map((section) => `section:${section.id}`)} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <RoomsSidebarSectionGroup
            key={section.id}
            section={section}
            onCollapsedChange={(isCollapsed) => sidebarSections.setCollapsed({ sectionId: section.id, isCollapsed })}
          >
            <SortableContext items={section.chats.map((chat) => chat.botId)} strategy={verticalListSortingStrategy}>
              {section.chats.map((chat) => <RoomItem chat={chat} key={chat.botId} />)}
            </SortableContext>
          </RoomsSidebarSectionGroup>
        ))}
      </SortableContext>
      <RoomsSidebarUngrouped id={ungroupedZone}>
        <Sidebar.SidebarGroup className={sections.length > 0 ? '-mt-2' : undefined}>
          <SortableContext items={others.map((chat) => chat.botId)} strategy={verticalListSortingStrategy}>
            <Sidebar.SidebarMenu>
              {others.map((chat) => <RoomItem chat={chat} key={chat.botId} />)}
            </Sidebar.SidebarMenu>
          </SortableContext>
        </Sidebar.SidebarGroup>
      </RoomsSidebarUngrouped>
      {hidden.length > 0 ? (
        <Collapsible className="group-data-[collapsible=icon]:hidden">
          <Sidebar.SidebarGroup>
            <Sidebar.SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                {m.rooms_hidden()}
                <span className="ml-auto tabular-nums">{hidden.length}</span>
              </CollapsibleTrigger>
            </Sidebar.SidebarGroupLabel>
            <CollapsibleContent>
              <Sidebar.SidebarMenu>
                {hidden.map((chat) => (
                  <RoomItem
                    chat={chat}
                    isSortable={false}
                    key={chat.botId}
                  />
                ))}
              </Sidebar.SidebarMenu>
            </CollapsibleContent>
          </Sidebar.SidebarGroup>
        </Collapsible>
      ) : null}
      {dragOverlayOnDocumentBody}
    </DndContext>
  );
}
