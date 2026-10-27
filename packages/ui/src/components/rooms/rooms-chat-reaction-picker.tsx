import { m } from '@repo/i18n/client';
import { useState } from 'react';
import IconSmile from '~icons/lucide/smile';
import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { RoomsChatEmojiChoices } from './rooms-chat-emoji-choices';

interface RoomsChatReactionPickerProps {
  disabled: boolean
  onPick: (emoji: string) => void
}

export function RoomsChatReactionPicker({ disabled, onPick }: RoomsChatReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const pick = (emoji: string) => {
    setOpen(false);
    onPick(emoji);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={m.rooms_reaction_add()}
          disabled={disabled}
          size="icon-xs"
          title={m.rooms_reaction_add()}
          variant="quiet"
        >
          <IconSmile className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        arrow={false}
        className="w-auto p-0"
      >
        <RoomsChatEmojiChoices layout="popover" onPick={pick} />
      </PopoverContent>
    </Popover>
  );
}
