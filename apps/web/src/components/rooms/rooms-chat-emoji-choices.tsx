import { ROOMS } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { cva } from 'cva';
import { lazy, Suspense, useState } from 'react';
import { RoomsChatEmojiLoading } from '@/components/rooms/rooms-chat-emoji-loading';
import { Button } from '@/components/ui/button';
import IconSmilePlus from '~icons/lucide/smile-plus';
import type { VariantProps } from 'cva';

const RoomsChatEmojiPicker = lazy(() => import('@/components/rooms/rooms-chat-emoji-picker').then((module) => ({ default: module.RoomsChatEmojiPicker })));

const roomsChatEmojiChoicesVariants = cva({
  base: 'flex items-center',
  variants: {
    layout: {
      popover: 'gap-0.5 p-1',
      sheet: 'justify-between',
    },
  },
});

interface RoomsChatEmojiChoicesProps extends Required<VariantProps<typeof roomsChatEmojiChoicesVariants>> {
  disabled?: boolean;
  onPick: (emoji: string) => void
}

export function RoomsChatEmojiChoices({ layout, disabled = false, onPick }: RoomsChatEmojiChoicesProps) {
  const [full, setFull] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (full) {
    const retry = () => setAttempt((count) => count + 1);

    return (
      <Suspense fallback={<RoomsChatEmojiLoading onRetry={retry} />} key={attempt}>
        <RoomsChatEmojiPicker
          layout={layout}
          onPick={onPick}
          onRetry={retry}
        />
      </Suspense>
    );
  }

  return (
    <div className={roomsChatEmojiChoicesVariants({ layout })}>
      {ROOMS.quickReactions.map((emoji) => (
        <Button
          aria-label={m.rooms_reaction_quick({ emoji })}
          disabled={disabled}
          key={emoji}
          size={layout === 'sheet' ? 'icon' : 'icon-sm'}
          title={m.rooms_reaction_quick({ emoji })}
          variant="ghost"
          onClick={() => onPick(emoji)}
        >
          <span className={layout === 'sheet' ? 'text-xl' : 'text-base'}>{emoji}</span>
        </Button>
      ))}
      <Button
        aria-label={m.rooms_reaction_more()}
        size={layout === 'sheet' ? 'icon' : 'icon-sm'}
        title={m.rooms_reaction_more()}
        variant="quiet"
        onClick={() => setFull(true)}
      >
        <IconSmilePlus className="size-4" />
      </Button>
    </div>
  );
}
