import { roomsSidebarOrder } from '@repo/client/client';
import { useSidebarSections } from '@repo/client/react';
import { LAYOUT_SHORTCUT_OPTIONS, LAYOUT_SHORTCUTS } from '@repo/ui/layout.constants';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useHotkeys } from 'react-hotkeys-hook';
import { roomsLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';

export function useLayoutShortcuts() {
  const navigate = useNavigate();
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const currentDirect = useMatch({ from: '/_chat/rooms/direct/$handle', shouldThrow: false });
  const { sections: sidebarSections } = useSidebarSections();
  const { pinned, sections, others } = roomsSidebarOrder({ chats, sections: sidebarSections });
  const ordered = [...pinned, ...sections.flatMap((section) => section.chats), ...others];
  const current = ordered.findIndex((chat) => chat.handle === currentDirect?.params.handle);

  const rotate = (step: number) => {
    const next = ordered.at((current === -1 && step < 0 ? 0 : current + step) % ordered.length);

    if (next) {
      void navigate(roomsLink({ handle: next.handle }));
    }
  };

  useHotkeys(LAYOUT_SHORTCUTS.newChat, () => void navigate({ to: '/rooms', search: { start: true } }), LAYOUT_SHORTCUT_OPTIONS);
  useHotkeys(LAYOUT_SHORTCUTS.search, () => void navigate({
    to: '.',
    search: (previous) => ({ ...previous, find: previous.find ? undefined : true }),
    replace: true,
  }), LAYOUT_SHORTCUT_OPTIONS);
  useHotkeys(LAYOUT_SHORTCUTS.previousRoom, () => rotate(-1), LAYOUT_SHORTCUT_OPTIONS);
  useHotkeys(LAYOUT_SHORTCUTS.nextRoom, () => rotate(1), LAYOUT_SHORTCUT_OPTIONS);
}
