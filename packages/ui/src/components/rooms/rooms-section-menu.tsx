import { useChatSectionMove, useSidebarSections } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import IconCheck from '~icons/lucide/check';
import IconFolder from '~icons/lucide/folder';
import IconFolderMinus from '~icons/lucide/folder-minus';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '../dropdown-menu';
import type { RoomsChat } from '@repo/client/client';

interface RoomsSectionMenuProps {
  chat: RoomsChat
}

export function RoomsSectionMenu({ chat }: RoomsSectionMenuProps) {
  const { sections } = useSidebarSections();
  const moveToSection = useChatSectionMove(chat.botId);
  const isInSection = !chat.isPinned && sections.some((section) => section.id === chat.sectionId);

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <IconFolder className="size-4" />
          {m.rooms_section_move()}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {sections.map((section) => (
            <DropdownMenuItem key={section.id} onSelect={() => moveToSection(section.id)}>
              {section.name}
              {chat.sectionId === section.id && !chat.isPinned ? <IconCheck className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      {isInSection ? (
        <DropdownMenuItem onSelect={() => moveToSection(null)}>
          <IconFolderMinus className="size-4" />
          {m.rooms_section_remove()}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}
