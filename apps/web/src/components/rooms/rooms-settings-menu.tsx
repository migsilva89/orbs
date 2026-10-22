import { Slot as SlotPrimitive } from 'radix-ui';
import { useState } from 'react';
import { RoomsActions } from '@/components/rooms/rooms-actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { RoomsChat } from '@repo/client/client';
import type { ComponentProps, MouseEvent, ReactElement } from 'react';

interface RoomsSettingsMenuProps {
  chat: RoomsChat
  children: ReactElement
  button?: ReactElement
  align?: ComponentProps<typeof DropdownMenuContent>['align']
}

export function RoomsSettingsMenu({ chat, children, button, align = 'start' }: RoomsSettingsMenuProps) {
  const [open, setOpen] = useState(false);

  const openOnRightClick = (event: MouseEvent) => {
    if (event.target === document.activeElement) {
      return;
    }

    event.preventDefault();
    setOpen(true);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {button ? (
        <>
          <SlotPrimitive.Slot onContextMenu={openOnRightClick}>{children}</SlotPrimitive.Slot>
          <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
        </>
      ) : (
        <DropdownMenuTrigger
          asChild
          onContextMenu={openOnRightClick}
          onPointerDown={(event) => event.preventDefault()}
        >
          {children}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={align}>
        <RoomsActions chat={chat} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
