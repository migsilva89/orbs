import { DndContext, DragOverlay, KeyboardSensor, MeasuringStrategy, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { m } from '@openbots/i18n/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { RoomItem } from '@/components/rooms/room-item';
import { RoomsDragCard } from '@/components/rooms/rooms-drag-card';
import { RoomsPinZone } from '@/components/rooms/rooms-pin-zone';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import * as Sidebar from '@/components/ui/sidebar';
import { useRoomsArrange } from '@/hooks/use-rooms-arrange';
import { roomsSidebarOrder } from '@/services/rooms/rooms.client';
import { ROOMS_DRAG_PRESS } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import IconPlus from '~icons/lucide/plus';
import IconSearch from '~icons/lucide/search';
import type { DragEndEvent } from '@dnd-kit/core';

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
            <Link
              to="/bots/create"
              onClick={() => setOpenMobile(false)}
            >
              <IconPlus className="size-4" />
              {m.rooms_bot_title()}
            </Link>
          )}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function RoomsSidebar() {
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const arrange = useRoomsArrange();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(TouchSensor, { activationConstraint: ROOMS_DRAG_PRESS }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { pinned, others, hidden } = roomsSidebarOrder({ chats });
  const shown = [...pinned, ...others];
  const dragged = shown.find((chat) => chat.botId === draggedId);
  const pinZone = 'pin';

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedId(null);
    const swallowClickThatEndsDrag = (event: Event) => event.stopPropagation();
    window.addEventListener('click', swallowClickThatEndsDrag, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallowClickThatEndsDrag, { capture: true }));

    if (!over || over.id === active.id) {
      return;
    }

    const toPinned = over.id === pinZone || pinned.some((chat) => chat.botId === over.id);
    const ids = shown.map((chat) => chat.botId);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), over.id === pinZone ? 0 : ids.indexOf(String(over.id)));
    const pinnedIds = pinned.map((chat) => chat.botId).filter((botId) => botId !== active.id);

    arrange({ botIds: next, pinnedIds: toPinned ? [...pinnedIds, String(active.id)] : pinnedIds });
  };

  const dragOverlayOnDocumentBody = dragged ? createPortal(
    <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
      <RoomsDragCard chat={dragged} />
    </DragOverlay>,
    document.body,
  ) : null;

  return (
    <DndContext
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      sensors={sensors}
      onDragCancel={() => setDraggedId(null)}
      onDragEnd={onDragEnd}
      onDragStart={({ active }) => setDraggedId(String(active.id))}
    >
      <SortableContext items={shown.map((chat) => chat.botId)} strategy={verticalListSortingStrategy}>
        {pinned.length === 0 && dragged ? <RoomsPinZone id={pinZone} /> : null}
        <Sidebar.SidebarGroup className="-mt-2">
          {chats.length === 0 ? <RoomsSidebarEmpty hasBots={bots.length > 0} /> : null}
          <Sidebar.SidebarMenu>
            {shown.map((chat) => <RoomItem chat={chat} key={chat.botId} />)}
          </Sidebar.SidebarMenu>
        </Sidebar.SidebarGroup>
      </SortableContext>
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
