import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { RoomsChatEmojiLoading } from '@/components/rooms/rooms-chat-emoji-loading';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '@/components/ui/emoji-picker';

interface RoomsChatEmojiPickerProps {
  layout: 'popover' | 'sheet';
  onPick: (emoji: string) => void;
  onRetry: () => void
}

export function RoomsChatEmojiPicker({ layout, onPick, onRetry }: RoomsChatEmojiPickerProps) {
  return (
    <EmojiPicker
      className={layout === 'sheet' ? 'h-72 w-full **:data-[slot=emoji-picker-row]:flex **:data-[slot=emoji-picker-row]:justify-between' : 'h-80'}
      columns={8}
      locale={getLocale()}
      onEmojiSelect={({ emoji }) => onPick(emoji)}
    >
      <EmojiPickerSearch
        aria-label={m.rooms_reaction_search()}
        placeholder={m.rooms_reaction_search()}
        ref={(node) => node?.focus()}
      />
      <EmojiPickerContent empty={m.rooms_reaction_empty()} loading={<RoomsChatEmojiLoading onRetry={onRetry} />} />
    </EmojiPicker>
  );
}
